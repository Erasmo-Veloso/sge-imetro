import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AssessmentPlansService } from './assessment-plans.service';
import { CreateAssessmentPlanDto } from './dto/create-assessment-plan.dto';
import { UpdateAssessmentPlanDto } from './dto/update-assessment-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AssessmentPlansController {
  constructor(private readonly plans: AssessmentPlansService) {}

  @Roles('TEACHER', 'ADMIN')
  @Post('classes/:classId/assessment-plan')
  create(@Param('classId', ParseUUIDPipe) classId: string, @Body() dto: CreateAssessmentPlanDto) {
    return this.plans.create(classId, dto);
  }

  @Get('classes/:classId/assessment-plan')
  findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.plans.findByClass(classId);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch('assessment-plans/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAssessmentPlanDto) {
    return this.plans.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete('assessment-plans/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.plans.remove(id);
  }
}
