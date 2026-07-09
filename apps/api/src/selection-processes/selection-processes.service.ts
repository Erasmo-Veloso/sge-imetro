import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSelectionProcessDto,
  PaginationDto,
  UpdateSelectionProcessDto,
} from './dto/selection-process.dto';

@Injectable()
export class SelectionProcessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSelectionProcessDto) {
    await this.ensureCourseExists(dto.courseId);
    if (new Date(dto.openDate) >= new Date(dto.closeDate)) {
      throw new ConflictException('Data de abertura deve ser anterior à de fecho');
    }
    try {
      return await this.prisma.selectionProcess.create({
        data: {
          courseId: dto.courseId,
          academicYear: dto.academicYear,
          period: dto.period,
          title: dto.title,
          description: dto.description,
          openDate: new Date(dto.openDate),
          closeDate: new Date(dto.closeDate),
          vacancies: dto.vacancies,
          status: 'DRAFT',
        },
        include: { course: { select: { id: true, name: true, code: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe um processo seletivo para este curso/ano/período');
      }
      throw e;
    }
  }

  async findAll(query: PaginationDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.SelectionProcessWhereInput = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { course: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.selectionProcess.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          course: { select: { id: true, name: true, code: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      this.prisma.selectionProcess.count({ where }),
    ]);
    return {
      items: items.map((s: (typeof items)[0]) => ({
        ...s,
        enrolledCount: s._count.enrollments,
        _count: undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const sp = await this.prisma.selectionProcess.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!sp) throw new NotFoundException('Processo seletivo não encontrado');
    return { ...sp, enrolledCount: sp._count.enrollments };
  }

  async update(id: string, dto: UpdateSelectionProcessDto) {
    await this.findOne(id);
    if (dto.openDate && dto.closeDate && new Date(dto.openDate) >= new Date(dto.closeDate)) {
      throw new ConflictException('Data de abertura deve ser anterior à de fecho');
    }
    return this.prisma.selectionProcess.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        openDate: dto.openDate ? new Date(dto.openDate) : undefined,
        closeDate: dto.closeDate ? new Date(dto.closeDate) : undefined,
        vacancies: dto.vacancies,
        status: dto.status,
      },
      include: { course: { select: { id: true, name: true, code: true } } },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.selectionProcess.delete({ where: { id } });
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');
  }
}
