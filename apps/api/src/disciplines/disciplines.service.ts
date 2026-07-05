import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisciplineDto, PaginationDto, UpdateDisciplineDto } from './dto/discipline.dto';

@Injectable()
export class DisciplinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDisciplineDto) {
    await this.ensureCourseExists(dto.courseId);
    try {
      return await this.prisma.discipline.create({
        data: {
          courseId: dto.courseId,
          name: dto.name,
          code: dto.code.toUpperCase(),
          description: dto.description,
          credits: dto.credits ?? 4,
          workloadHrs: dto.workloadHrs ?? 60,
          semester: dto.semester ?? 1,
        },
        include: { course: { select: { id: true, name: true, code: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe uma disciplina com este código no curso');
      }
      throw e;
    }
  }

  async findAll(query: PaginationDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.DisciplineWhereInput = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.discipline.findMany({
        where,
        orderBy: [{ semester: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { course: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.discipline.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const discipline = await this.prisma.discipline.findUnique({
      where: { id },
      include: { course: { select: { id: true, name: true, code: true } } },
    });
    if (!discipline) throw new NotFoundException('Disciplina não encontrada');
    return discipline;
  }

  async update(id: string, dto: UpdateDisciplineDto) {
    await this.findOne(id);
    try {
      return await this.prisma.discipline.update({
        where: { id },
        data: {
          name: dto.name,
          code: dto.code?.toUpperCase(),
          description: dto.description,
          credits: dto.credits,
          workloadHrs: dto.workloadHrs,
          semester: dto.semester,
        },
        include: { course: { select: { id: true, name: true, code: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe uma disciplina com este código no curso');
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.discipline.delete({ where: { id } });
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');
  }
}
