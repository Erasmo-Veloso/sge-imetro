import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto) {
    try {
      const cls = await this.prisma.class.create({
        data: {
          disciplineId: dto.disciplineId,
          teacherId: dto.teacherId,
          year: dto.year,
          period: (dto.period as any) ?? 'FIRST',
          capacity: dto.capacity ?? 60,
          schedule: dto.schedule,
          room: dto.room,
        },
        include: {
          discipline: true,
          teacher: { select: { id: true, name: true, email: true } },
        },
      });
      this.logger.log(`class created id=${cls.id}`);
      return cls;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe uma turma para esta disciplina/ano/periodo');
      }
      throw e;
    }
  }

  async findAll(params: { page?: number; pageSize?: number; search?: string; year?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where: Prisma.ClassWhereInput = {};

    if (params.year) where.year = params.year;

    if (params.search) {
      where.OR = [
        { discipline: { name: { contains: params.search, mode: 'insensitive' } } },
        { discipline: { code: { contains: params.search, mode: 'insensitive' } } },
        { teacher: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          discipline: true,
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { registrations: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ year: 'desc' }, { period: 'asc' }],
      }),
      this.prisma.class.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        discipline: true,
        teacher: { select: { id: true, name: true, email: true } },
        registrations: { include: { student: { select: { id: true, name: true, email: true } } } },
        _count: { select: { registrations: true } },
      },
    });
    if (!cls) throw new NotFoundException('Turma não encontrada');
    return cls;
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id);
    try {
      const cls = await this.prisma.class.update({
        where: { id },
        data: {
          disciplineId: dto.disciplineId,
          teacherId: dto.teacherId,
          year: dto.year,
          period: dto.period as any,
          capacity: dto.capacity,
          schedule: dto.schedule,
          room: dto.room,
        },
        include: {
          discipline: true,
          teacher: { select: { id: true, name: true, email: true } },
        },
      });
      this.logger.log(`class updated id=${id}`);
      return cls;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe uma turma para esta disciplina/ano/periodo');
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.class.delete({ where: { id } });
    this.logger.log(`class deleted id=${id}`);
  }
}
