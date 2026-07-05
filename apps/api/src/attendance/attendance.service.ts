import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { customAlphabet } from 'nanoid';
import * as QRCode from 'qrcode';

const generateToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);
const QR_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSession(classId: string) {
    const classRecord = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord) throw new NotFoundException('Turma não encontrada');

    const qrToken = generateToken();
    const qrExpiresAt = new Date(Date.now() + QR_TTL_MS);

    const session = await this.prisma.classSession.create({
      data: {
        classId,
        qrToken,
        qrExpiresAt,
        status: 'OPEN',
      },
    });

    const qrDataUrl = await QRCode.toDataURL(qrToken);

    this.logger.log(`session created id=${session.id} classId=${classId}`);
    return { ...session, qrDataUrl };
  }

  async verifyQr(studentId: string, qrToken: string) {
    const session = await this.prisma.classSession.findFirst({
      where: {
        qrToken,
        qrExpiresAt: { gt: new Date() },
        status: 'OPEN',
      },
    });
    if (!session) {
      throw new BadRequestException('QR token inválido ou expirado');
    }

    const registration = await this.prisma.registration.findFirst({
      where: { studentId, classId: session.classId, status: 'ACTIVE' },
    });
    if (!registration) {
      throw new ForbiddenException('Não está inscrito nesta turma');
    }

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          registrationId: registration.id,
          classSessionId: session.id,
          status: 'PRESENT',
          method: 'QR',
        },
      });

      this.logger.log(
        `attendance via QR registrationId=${registration.id} sessionId=${session.id}`,
      );
      return attendance;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Presença já registada para esta sessão');
      }
      throw e;
    }
  }

  async recordManual(
    classId: string,
    sessionId: string,
    dto: { registrationId: string; status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE' },
  ) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, classId },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          registrationId: dto.registrationId,
          classSessionId: sessionId,
          status: dto.status,
          method: 'MANUAL',
        },
      });

      this.logger.log(
        `manual attendance registrationId=${dto.registrationId} sessionId=${sessionId}`,
      );
      return attendance;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Presença já registada para esta sessão');
      }
      throw e;
    }
  }

  async listSessions(classId: string) {
    return this.prisma.classSession.findMany({
      where: { classId },
      orderBy: { date: 'desc' },
    });
  }

  async listAttendances(sessionId: string) {
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    return this.prisma.attendance.findMany({
      where: { classSessionId: sessionId },
      include: { registration: { include: { student: true } } },
      orderBy: { markedAt: 'asc' },
    });
  }

  async updateAttendance(id: string, status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE') {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) throw new NotFoundException('Registo de presença não encontrado');

    return this.prisma.attendance.update({
      where: { id },
      data: { status },
    });
  }

  async closeSession(sessionId: string) {
    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    return this.prisma.classSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', closedAt: new Date(), qrToken: null, qrExpiresAt: null },
    });
  }
}
