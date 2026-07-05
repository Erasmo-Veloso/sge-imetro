import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import { CreateEnrollmentDto, PaginationDto, ReviewEnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly storage: StorageService,
  ) {}

  async create(userId: string, dto: CreateEnrollmentDto) {
    const sp = await this.prisma.selectionProcess.findUnique({
      where: { id: dto.selectionProcessId },
    });
    if (!sp) throw new NotFoundException('Processo seletivo não encontrado');
    if (sp.status !== 'OPEN') {
      throw new ConflictException(`Processo seletivo não está aberto (estado: ${sp.status})`);
    }
    const now = new Date();
    if (now < sp.openDate || now > sp.closeDate) {
      throw new ConflictException('Fora do período de inscrição');
    }

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          selectionProcessId: dto.selectionProcessId,
          status: 'SUBMITTED',
        },
        include: {
          selectionProcess: {
            include: { course: { select: { id: true, name: true, code: true } } },
          },
        },
      });
      return enrollment;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já está inscrito neste processo seletivo');
      }
      throw e;
    }
  }

  async uploadDocument(
    enrollmentId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    type: 'ID_DOCUMENT' | 'PAYMENT_PROOF' | 'TRANSCRIPT' | 'PHOTO' | 'OTHER',
  ) {
    const enrollment = await this.ensureOwned(enrollmentId, userId);
    if (enrollment.status !== 'SUBMITTED' && enrollment.status !== 'IN_REVIEW') {
      throw new ConflictException('Não pode carregar documentos após revisão');
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      throw new ConflictException('Formato não permitido (use JPG, PNG ou PDF)');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ConflictException('Ficheiro demasiado grande (máx. 5MB)');
    }

    const stored = await this.storage.save(file.buffer, file.originalname, file.mimetype);

    return this.prisma.enrollmentDocument.create({
      data: {
        enrollmentId,
        type,
        fileUrl: stored.url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
  }

  async listDocuments(enrollmentId: string, userId: string) {
    await this.ensureOwnedOrAdmin(enrollmentId, userId);
    return this.prisma.enrollmentDocument.findMany({
      where: { enrollmentId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findAll(query: PaginationDto, userRole: string, userId: string) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Prisma.EnrollmentWhereInput = {};
    if (query.selectionProcessId) where.selectionProcessId = query.selectionProcessId;
    if (query.status) where.status = query.status;
    // Students only see their own
    if (userRole === 'STUDENT') where.userId = userId;
    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }
    const [items, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
          selectionProcess: {
            select: {
              id: true,
              title: true,
              course: { select: { id: true, name: true, code: true } },
            },
          },
          reviewedBy: { select: { id: true, name: true } },
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        selectionProcess: {
          select: {
            id: true,
            title: true,
            vacancies: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
        reviewedBy: { select: { id: true, name: true } },
        documents: true,
        registration: true,
      },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada');
    if (userRole === 'STUDENT' && enrollment.userId !== userId) {
      throw new NotFoundException('Inscrição não encontrada');
    }
    return enrollment;
  }

  async review(id: string, reviewerId: string, dto: ReviewEnrollmentDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { user: true, selectionProcess: true },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada');
    if (enrollment.status === 'APPROVED' || enrollment.status === 'REJECTED') {
      throw new ConflictException('Inscrição já foi decidida');
    }

    // Vagas: se aprovar e exceder, mover para WAITLIST
    let decision: typeof dto.decision = dto.decision;
    if (dto.decision === 'APPROVED') {
      const sp = enrollment.selectionProcess;
      const approvedCount = await this.prisma.enrollment.count({
        where: { selectionProcessId: sp.id, status: 'APPROVED' },
      });
      if (approvedCount >= sp.vacancies) {
        decision = 'WAITLIST';
      }
    }

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: {
        status: decision,
        reviewedById: reviewerId,
        reviewNote: dto.reviewNote,
        rejectionReason: dto.rejectionReason,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        selectionProcess: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    // Notify
    try {
      await this.mail.sendEnrollmentStatus(
        { email: enrollment.user.email },
        enrollment.user.name,
        decision,
      );
    } catch {
      // email failure shouldn't break the flow
    }

    return updated;
  }

  async findByUser(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        selectionProcess: {
          select: {
            id: true,
            title: true,
            academicYear: true,
            period: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { documents: true } },
      },
    });
  }

  private async ensureOwned(enrollmentId: string, userId: string) {
    const e = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!e) throw new NotFoundException('Inscrição não encontrada');
    if (e.userId !== userId) throw new NotFoundException('Inscrição não encontrada');
    return e;
  }

  private async ensureOwnedOrAdmin(enrollmentId: string, userId: string) {
    const e = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: { select: { role: true } } },
    });
    if (!e) throw new NotFoundException('Inscrição não encontrada');
    if (e.userId !== userId && e.user.role !== 'ADMIN' && e.user.role !== 'TEACHER') {
      throw new NotFoundException('Inscrição não encontrada');
    }
    return e;
  }
}
