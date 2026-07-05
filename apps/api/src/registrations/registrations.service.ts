import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    studentId: string,
    dto: { classId: string; academicYear: number; enrollmentId?: string },
  ) {
    const cls = await this.prisma.class.findUnique({
      where: { id: dto.classId },
      include: { discipline: { include: { course: true } } },
    });
    if (!cls) throw new NotFoundException('Turma não encontrada');

    // Capacity check
    const activeCount = await this.prisma.registration.count({
      where: { classId: dto.classId, status: 'ACTIVE' },
    });
    if (activeCount >= cls.capacity) {
      throw new ConflictException('Turma sem vagas disponíveis');
    }

    // If enrollment provided, ensure it's APPROVED and belongs to student
    if (dto.enrollmentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
      });
      if (!enrollment || enrollment.userId !== studentId) {
        throw new NotFoundException('Inscrição não encontrada');
      }
      if (enrollment.status !== 'APPROVED') {
        throw new ConflictException('Inscrição não aprovada');
      }
    }

    try {
      return await this.prisma.registration.create({
        data: {
          studentId,
          classId: dto.classId,
          academicYear: dto.academicYear,
          enrollmentId: dto.enrollmentId ?? null,
          status: 'ACTIVE',
        },
        include: {
          class: {
            include: {
              discipline: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já está matriculado nesta turma');
      }
      throw e;
    }
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    classId?: string;
    studentId?: string;
    status?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.RegistrationWhereInput = {};
    if (query.classId) where.classId = query.classId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status as never;

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        orderBy: { enrolledAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: { select: { id: true, name: true, email: true } },
          class: {
            include: {
              discipline: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      this.prisma.registration.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findByStudent(studentId: string) {
    return this.prisma.registration.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        class: {
          include: {
            discipline: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async cancel(id: string, studentId: string, userRole: string): Promise<void> {
    const reg = await this.prisma.registration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Matrícula não encontrada');
    if (userRole === 'STUDENT' && reg.studentId !== studentId) {
      throw new NotFoundException('Matrícula não encontrada');
    }
    if (reg.status === 'CANCELLED') return;
    await this.prisma.registration.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}
