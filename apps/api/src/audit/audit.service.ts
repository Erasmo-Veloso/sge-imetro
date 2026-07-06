import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(
    ownerId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    type: string,
  ) {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      throw new ConflictException('Formato não permitido (use JPG, PNG ou PDF)');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ConflictException('Ficheiro demasiado grande (máx. 5MB)');
    }

    const stored = await this.storage.save(file.buffer, file.originalname, file.mimetype);

    return this.prisma.auditDocument.create({
      data: {
        ownerId,
        type,
        fileUrl: stored.url,
        status: 'PENDING',
      },
    });
  }

  async findByOwner(ownerId: string) {
    return this.prisma.auditDocument.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params: { page?: number; pageSize?: number; status?: string; search?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.AuditDocumentWhereInput = {};

    if (params.status) where.status = params.status;
    if (params.search) {
      where.user = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditDocument.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async verify(documentId: string, decision: 'VERIFIED' | 'REJECTED', _note?: string) {
    const document = await this.prisma.auditDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Documento não encontrado');
    if (document.status !== 'PENDING') {
      throw new ConflictException('Documento já foi verificado');
    }

    return this.prisma.auditDocument.update({
      where: { id: documentId },
      data: {
        status: decision,
      },
    });
  }
}
