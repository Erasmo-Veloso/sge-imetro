import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        concept: dto.concept,
        status: 'PENDING',
        gateway: 'MULTICAIXA_MOCK',
      },
    });
  }

  async processPayment(dto: ProcessPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status !== 'PENDING') {
      throw new ConflictException('Pagamento já foi processado');
    }

    const succeeded = Math.random() < 0.8;
    const status = succeeded ? 'COMPLETED' : 'FAILED';
    const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const rawResponse = {
      transactionId,
      phone: dto.phone,
      amount: payment.amount,
      status,
      gateway: 'MULTICAIXA_MOCK',
      timestamp: new Date().toISOString(),
      message: succeeded
        ? 'Pagamento processado com sucesso'
        : 'Saldo insuficiente ou erro no gateway',
    };

    return this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status,
        rawResponse,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params: { page?: number; pageSize?: number; status?: string; search?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.PaymentWhereInput = {};

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
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }
}
