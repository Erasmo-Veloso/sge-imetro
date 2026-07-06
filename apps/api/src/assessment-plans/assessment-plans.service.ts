import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentPlanDto } from './dto/create-assessment-plan.dto';
import { UpdateAssessmentPlanDto } from './dto/update-assessment-plan.dto';

@Injectable()
export class AssessmentPlansService {
  private readonly logger = new Logger(AssessmentPlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(classId: string, dto: CreateAssessmentPlanDto) {
    this.validateWeights(dto.items);

    const existing = await this.prisma.assessmentPlan.findUnique({ where: { classId } });
    if (existing) {
      throw new BadRequestException('Esta turma já possui plano de avaliação');
    }

    const plan = await this.prisma.assessmentPlan.create({
      data: {
        classId,
        scaleMax: dto.scaleMax,
        passingScore: dto.passingScore,
        minAttendancePct: dto.minAttendancePct,
        roundingRule: dto.roundingRule,
        items: {
          create: dto.items.map((item, index) => ({
            type: item.type,
            name: item.name,
            weight: item.weight,
            maxScore: item.maxScore ?? dto.scaleMax,
            order: item.order ?? index,
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    this.logger.log(`assessment plan created id=${plan.id} classId=${classId}`);
    return plan;
  }

  async findByClass(classId: string) {
    const plan = await this.prisma.assessmentPlan.findUnique({
      where: { classId },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plano de avaliação não encontrado');
    return plan;
  }

  async findOne(id: string) {
    const plan = await this.prisma.assessmentPlan.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plano de avaliação não encontrado');
    return plan;
  }

  async update(id: string, dto: UpdateAssessmentPlanDto) {
    const current = await this.findOne(id);

    if (dto.items) {
      this.validateWeights(dto.items);
    }

    const scaleMax = dto.scaleMax ?? current.scaleMax;

    const plan = await this.prisma.assessmentPlan.update({
      where: { id },
      data: {
        scaleMax: dto.scaleMax,
        passingScore: dto.passingScore,
        minAttendancePct: dto.minAttendancePct,
        roundingRule: dto.roundingRule,
        items: dto.items
          ? {
              deleteMany: {},
              create: dto.items.map((item, index) => ({
                type: item.type!,
                name: item.name!,
                weight: item.weight!,
                maxScore: item.maxScore ?? scaleMax,
                order: item.order ?? index,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    this.logger.log(`assessment plan updated id=${id}`);
    return plan;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.assessmentPlan.delete({ where: { id } });
    this.logger.log(`assessment plan deleted id=${id}`);
  }

  private validateWeights(items: { weight?: number }[]) {
    const total = items.reduce((sum, item) => sum + (item.weight ?? 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException(`Os pesos devem somar 100. Atual: ${total.toFixed(2)}`);
    }
  }
}
