import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const CHUNK_SIZE = 500;

interface ParsedRecord {
  table: string;
  data: Record<string, string>;
}

@Injectable()
export class LegacyService {
  private readonly logger = new Logger(LegacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(file: Express.Multer.File, type: 'CSV' | 'SQL', mapping?: Record<string, string>) {
    const stored = await this.storage.save(file.buffer, file.originalname, file.mimetype);
    this.logger.log(`File stored at ${stored.key}`);

    const importRecord = await this.prisma.legacyImport.create({
      data: {
        type,
        filename: file.originalname,
        status: 'PENDING',
        errors: [],
      },
    });

    setImmediate(() => this.processImport(importRecord.id, file.buffer, type, mapping));

    return importRecord;
  }

  async getStatus(id: string) {
    const record = await this.prisma.legacyImport.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Importação não encontrada');
    return record;
  }

  async findAll(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.legacyImport.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.legacyImport.count(),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  private async processImport(
    importId: string,
    buffer: Buffer,
    type: 'CSV' | 'SQL',
    mapping?: Record<string, string>,
  ) {
    await this.prisma.legacyImport.update({
      where: { id: importId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    try {
      const records =
        type === 'CSV' ? this.parseCsv(buffer, mapping) : this.parseSql(buffer, mapping);

      const totalRecords = records.length;

      await this.prisma.legacyImport.update({
        where: { id: importId },
        data: { totalRecords },
      });

      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const errors = await this.processChunk(chunk);
        const errorCount = errors.length;

        await this.prisma.legacyImport.update({
          where: { id: importId },
          data: {
            processedRecords: Math.min(i + CHUNK_SIZE, totalRecords),
            errorRecords: { increment: errorCount },
            errors: errors.length > 0 ? errors.slice(0, 100) : undefined,
          },
        });

        if (errorCount > 0) {
          this.logger.warn(`Chunk ${i / CHUNK_SIZE}: ${errorCount} errors`);
        }
      }

      await this.prisma.legacyImport.update({
        where: { id: importId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      this.logger.log(`Import ${importId} completed: ${totalRecords} records`);
    } catch (e: any) {
      this.logger.error(`Import ${importId} failed: ${e.message}`);
      await this.prisma.legacyImport.update({
        where: { id: importId },
        data: { status: 'FAILED', errors: [e.message] },
      });
    }
  }

  private parseCsv(buffer: Buffer, mapping?: Record<string, string>): ParsedRecord[] {
    const content = buffer.toString('utf-8');
    const records: ParsedRecord[] = [];

    const rawRecords = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    for (const raw of rawRecords) {
      const data: Record<string, string> = {};
      for (const [key, value] of Object.entries(raw)) {
        const mappedKey = mapping?.[key] ?? key;
        data[mappedKey] = value;
      }

      const table = this.inferTable(data);
      records.push({ table, data });
    }

    return records;
  }

  private parseSql(buffer: Buffer, _mapping?: Record<string, string>): ParsedRecord[] {
    const content = buffer.toString('utf-8');
    const records: ParsedRecord[] = [];

    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*(.*?);/gis;
    let match: RegExpExecArray | null;

    while ((match = insertRegex.exec(content)) !== null) {
      const table = match[1].toLowerCase();
      const columns = match[2].split(',').map((c) => c.trim().replace(/["`]/g, ''));
      const valuesStr = match[3];

      const valueRegex = /\((.*?)\)/g;
      let valueMatch: RegExpExecArray | null;

      while ((valueMatch = valueRegex.exec(valuesStr)) !== null) {
        const rawValues = this.splitSqlValues(valueMatch[1]);
        const data: Record<string, string> = {};

        for (let i = 0; i < columns.length && i < rawValues.length; i++) {
          data[columns[i]] = rawValues[i];
        }

        records.push({ table, data });
      }
    }

    return records;
  }

  private splitSqlValues(values: string): string[] {
    const result: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < values.length; i++) {
      const ch = values[i];

      if (inString) {
        if (ch === stringChar && values[i + 1] === stringChar) {
          current += ch;
          i++;
        } else if (ch === stringChar) {
          inString = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === "'" || ch === '"') {
          inString = true;
          stringChar = ch;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }

    if (current.trim()) result.push(current.trim());
    return result;
  }

  private inferTable(data: Record<string, string>): string {
    if (data.email && data.password_hash) return 'user';
    if (data.enrollment_id || data.student_id) return 'enrollment';
    if (data.grade || data.score) return 'grade';
    if (data.registration_id || data.class_id) return 'registration';
    if (data.payment_ref || data.amount) return 'payment';
    return 'unknown';
  }

  private async processChunk(chunk: ParsedRecord[]): Promise<string[]> {
    const errors: string[] = [];

    for (const record of chunk) {
      try {
        await this.insertRecord(record);
      } catch (e: any) {
        errors.push(`Record error: ${e.message}`);
      }
    }

    return errors;
  }

  private async insertRecord(record: ParsedRecord) {
    switch (record.table) {
      case 'user': {
        const email = record.data.email || `${record.data.name || 'user'}@legacy.local`;
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (!existing) {
          await this.prisma.user.create({
            data: {
              name: record.data.name || record.data.nome || 'Unknown',
              email,
              passwordHash: record.data.password_hash || '$2b$12$legacy',
              role: (record.data.role?.toUpperCase() as any) || 'STUDENT',
              status: 'ACTIVE',
              phone: record.data.phone,
              externalCode: record.data.external_code || record.data.matricula,
            },
          });
        }
        break;
      }
      case 'enrollment': {
        const user = await this.prisma.user.findFirst({
          where: { externalCode: record.data.student_id || record.data.matricula },
        });
        if (user) {
          const process = await this.prisma.selectionProcess.findFirst({
            orderBy: { academicYear: 'desc' },
          });
          if (process) {
            await this.prisma.enrollment.upsert({
              where: {
                userId_selectionProcessId: { userId: user.id, selectionProcessId: process.id },
              },
              update: { status: 'APPROVED' },
              create: { userId: user.id, selectionProcessId: process.id, status: 'APPROVED' },
            });
          }
        }
        break;
      }
      case 'grade': {
        const student = await this.prisma.user.findFirst({
          where: { externalCode: record.data.student_id },
        });
        const registration = student
          ? await this.prisma.registration.findFirst({ where: { studentId: student.id } })
          : null;
        const item = await this.prisma.assessmentItem.findFirst({ orderBy: { order: 'asc' } });
        const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (registration && item) {
          await this.prisma.grade.upsert({
            where: {
              registrationId_assessmentItemId: {
                registrationId: registration.id,
                assessmentItemId: item.id,
              },
            },
            update: { score: parseFloat(record.data.grade || record.data.score || '0') },
            create: {
              registrationId: registration.id,
              assessmentItemId: item.id,
              score: parseFloat(record.data.grade || record.data.score || '0'),
              recordedById: admin?.id || registration.studentId,
            },
          });
        }
        break;
      }
      case 'registration': {
        const student = await this.prisma.user.findFirst({
          where: { externalCode: record.data.student_id },
        });
        const cls = await this.prisma.class.findFirst({
          where: { id: record.data.class_id || undefined },
        });
        if (student && cls) {
          await this.prisma.registration.upsert({
            where: {
              studentId_classId_academicYear: {
                studentId: student.id,
                classId: cls.id,
                academicYear: new Date().getFullYear(),
              },
            },
            update: {},
            create: {
              studentId: student.id,
              classId: cls.id,
              academicYear: new Date().getFullYear(),
            },
          });
        }
        break;
      }
      case 'payment': {
        const user = await this.prisma.user.findFirst({
          where: { externalCode: record.data.student_id },
        });
        if (user) {
          await this.prisma.payment.create({
            data: {
              userId: user.id,
              amount: parseFloat(record.data.amount || record.data.valor || '0'),
              concept: record.data.concept || record.data.descricao || 'Legacy import',
              reference: record.data.payment_ref || record.data.referencia,
              status: record.data.status?.toUpperCase() === 'PAGO' ? 'COMPLETED' : 'PENDING',
            },
          });
        }
        break;
      }
      default:
        break;
    }
  }
}
