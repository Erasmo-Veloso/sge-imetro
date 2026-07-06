import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkRecordGradesDto } from './dto/bulk-record-grades.dto';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async bulkRecord(classId: string, dto: BulkRecordGradesDto, teacherId: string) {
    const classRecord = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord) throw new NotFoundException('Turma não encontrada');

    const results: { registrationId: string; assessmentItemId: string; score: number }[] = [];

    for (const entry of dto.grades) {
      const grade = await this.prisma.grade.upsert({
        where: {
          registrationId_assessmentItemId: {
            registrationId: entry.registrationId,
            assessmentItemId: entry.assessmentItemId,
          },
        },
        update: { score: entry.score, note: entry.note, recordedById: teacherId },
        create: {
          registrationId: entry.registrationId,
          assessmentItemId: entry.assessmentItemId,
          score: entry.score,
          note: entry.note,
          recordedById: teacherId,
        },
      });
      results.push({
        registrationId: grade.registrationId,
        assessmentItemId: grade.assessmentItemId,
        score: grade.score,
      });
    }

    this.logger.log(`bulk grades recorded count=${results.length} classId=${classId}`);
    return results;
  }

  async findByRegistration(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });
    if (!registration) throw new NotFoundException('Matrícula não encontrada');

    return this.prisma.grade.findMany({
      where: { registrationId },
      include: { assessmentItem: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculateAverage(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        class: {
          include: {
            assessmentPlan: {
              include: { items: true },
            },
          },
        },
      },
    });
    if (!registration) throw new NotFoundException('Matrícula não encontrada');

    const plan = registration.class.assessmentPlan;
    if (!plan) throw new NotFoundException('Plano de avaliação não encontrado');

    const grades = await this.prisma.grade.findMany({
      where: { registrationId },
      include: { assessmentItem: true },
    });

    let weightedSum = 0;
    let totalWeight = 0;

    for (const grade of grades) {
      const item = plan.items.find((i) => i.id === grade.assessmentItemId);
      if (item) {
        const normalizedScore = (grade.score / item.maxScore) * plan.scaleMax;
        weightedSum += normalizedScore * (item.weight / 100);
        totalWeight += item.weight;
      }
    }

    const average = totalWeight > 0 ? weightedSum : 0;
    const passed = average >= plan.passingScore;

    return {
      registrationId,
      average: Math.round(average * 100) / 100,
      passed,
      passingScore: plan.passingScore,
      scaleMax: plan.scaleMax,
      totalWeight,
    };
  }

  async findAllByClass(classId: string) {
    return this.prisma.grade.findMany({
      where: { registration: { classId } },
      include: { assessmentItem: true, registration: { include: { student: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
