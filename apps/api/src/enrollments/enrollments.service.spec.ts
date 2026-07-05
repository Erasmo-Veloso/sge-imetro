import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentsService } from './enrollments.service';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import { validateEnv } from '../config/env';

describe('EnrollmentsService (integration)', () => {
  let moduleRef: TestingModule;
  let service: EnrollmentsService;
  let prisma: PrismaService;

  jest.setTimeout(30_000);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: (raw) => validateEnv(raw),
        }),
      ],
      providers: [
        EnrollmentsService,
        PrismaService,
        { provide: MailService, useValue: { sendEnrollmentStatus: jest.fn() } },
        {
          provide: StorageService,
          useValue: { save: jest.fn(), delete: jest.fn(), resolveUrl: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(EnrollmentsService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it('should create enrollment for an OPEN process', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    const student = await prisma.user.create({
      data: {
        name: 'Sprint2 Student',
        email: `sprint2+student@sg.local`,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const course = await prisma.course.create({
      data: { name: 'Test Sprint2', code: `TS2-${Date.now()}`, durationYears: 3 },
    });
    const sp = await prisma.selectionProcess.create({
      data: {
        courseId: course.id,
        academicYear: 2026,
        period: 'FIRST',
        title: 'Processo Teste',
        openDate: new Date(Date.now() - 86400000),
        closeDate: new Date(Date.now() + 86400000),
        vacancies: 10,
        status: 'OPEN',
      },
    });

    try {
      const enrollment = await service.create(student.id, { selectionProcessId: sp.id });
      expect(enrollment.id).toBeTruthy();
      expect(enrollment.status).toBe('SUBMITTED');

      // Duplicate enrollment should fail
      await expect(service.create(student.id, { selectionProcessId: sp.id })).rejects.toThrow(
        ConflictException,
      );
    } finally {
      await prisma.enrollment.deleteMany({ where: { userId: student.id } });
      await prisma.selectionProcess.delete({ where: { id: sp.id } });
      await prisma.course.delete({ where: { id: course.id } });
      await prisma.user.delete({ where: { id: student.id } });
    }
  });

  it('should reject enrollment for non-OPEN process', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 4);
    const student = await prisma.user.create({
      data: {
        name: 'Sprint2 Closed',
        email: `sprint2+closed@sg.local`,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const course = await prisma.course.create({
      data: { name: 'Test Closed', code: `TC-${Date.now()}`, durationYears: 3 },
    });
    const sp = await prisma.selectionProcess.create({
      data: {
        courseId: course.id,
        academicYear: 2026,
        period: 'FIRST',
        title: 'Processo Fechado',
        openDate: new Date(Date.now() - 86400000),
        closeDate: new Date(Date.now() + 86400000),
        vacancies: 10,
        status: 'CLOSED',
      },
    });

    try {
      await expect(service.create(student.id, { selectionProcessId: sp.id })).rejects.toThrow(
        ConflictException,
      );
    } finally {
      await prisma.selectionProcess.delete({ where: { id: sp.id } });
      await prisma.course.delete({ where: { id: course.id } });
      await prisma.user.delete({ where: { id: student.id } });
    }
  });

  it('should move to WAITLIST when vacancies exceeded', async () => {
    const ts = Date.now();
    const admin = await prisma.user.create({
      data: {
        name: 'Sprint2 Admin',
        email: `sprint2+admin+${ts}@sg.local`,
        passwordHash: '$2a$04$xxx',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    const course = await prisma.course.create({
      data: { name: 'Test Waitlist', code: `TW-${ts}`, durationYears: 3 },
    });
    const sp = await prisma.selectionProcess.create({
      data: {
        courseId: course.id,
        academicYear: 2026,
        period: 'FIRST',
        title: 'Vagas Esgotadas',
        openDate: new Date(Date.now() - 86400000),
        closeDate: new Date(Date.now() + 86400000),
        vacancies: 1,
        status: 'OPEN',
      },
    });

    const students = [];
    for (let i = 0; i < 3; i++) {
      const passwordHash = await bcrypt.hash('Password123!', 4);
      const s = await prisma.user.create({
        data: {
          name: `Student ${i}`,
          email: `sprint2+wl${i}+${ts}@sg.local`,
          passwordHash,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });
      students.push(s);
      await service.create(s.id, { selectionProcessId: sp.id });
    }

    try {
      // Approve first — should be APPROVED
      const enr1 = await prisma.enrollment.findFirst({
        where: { userId: students[0].id, selectionProcessId: sp.id },
      });
      const r1 = await service.review(enr1!.id, admin.id, { decision: 'APPROVED' });
      expect(r1.status).toBe('APPROVED');

      // Approve second — should be WAITLIST (vacancies=1 already filled)
      const enr2 = await prisma.enrollment.findFirst({
        where: { userId: students[1].id, selectionProcessId: sp.id },
      });
      const r2 = await service.review(enr2!.id, admin.id, { decision: 'APPROVED' });
      expect(r2.status).toBe('WAITLIST');
    } finally {
      await prisma.enrollment.deleteMany({ where: { selectionProcessId: sp.id } });
      await prisma.selectionProcess.delete({ where: { id: sp.id } });
      await prisma.course.delete({ where: { id: course.id } });
      for (const s of students) await prisma.user.delete({ where: { id: s.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    }
  });
});
