import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateUserDto) {
    const rounds = this.config.get<number>('BCRYPT_ROUNDS') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          status: 'ACTIVE',
          phone: dto.phone,
          externalCode: dto.externalCode,
        },
      });
      this.logger.log(`user created id=${user.id} email=${user.email}`);
      return this.publicUser(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e.meta as { target?: string[] })?.target?.join(', ') ?? 'campo';
        throw new ConflictException(`Já existe utilizador com: ${target}`);
      }
      throw e;
    }
  }

  async findAll(query: PaginationDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { externalCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u: (typeof items)[0]) => this.publicUser(u)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return this.publicUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        status: dto.status,
        phone: dto.phone,
        externalCode: dto.externalCode,
      },
    });
    return this.publicUser(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  private publicUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone: string | null;
    externalCode: string | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      externalCode: user.externalCode,
      createdAt: user.createdAt,
    };
  }
}
