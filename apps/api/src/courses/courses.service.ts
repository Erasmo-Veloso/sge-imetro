import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, PaginationDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    try {
      return await this.prisma.course.create({
        data: {
          name: dto.name,
          code: dto.code.toUpperCase(),
          description: dto.description,
          durationYears: dto.durationYears ?? 3,
          coordinatorId: dto.coordinatorId || null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe um curso com este código');
      }
      throw e;
    }
  }

  async findAll(query: PaginationDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.CourseWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { coordinator: { select: { id: true, name: true } } },
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { coordinator: { select: { id: true, name: true } } },
    });
    if (!course) throw new NotFoundException('Curso não encontrado');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    try {
      return await this.prisma.course.update({
        where: { id },
        data: {
          name: dto.name,
          code: dto.code?.toUpperCase(),
          description: dto.description,
          durationYears: dto.durationYears,
          coordinatorId: dto.coordinatorId === undefined ? undefined : dto.coordinatorId || null,
          status: dto.status as 'ACTIVE' | 'ARCHIVED' | undefined,
        },
        include: { coordinator: { select: { id: true, name: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe um curso com este código');
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.course.delete({ where: { id } });
  }
}
