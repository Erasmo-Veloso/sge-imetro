import { Module } from '@nestjs/common';
import { AssessmentPlansController } from './assessment-plans.controller';
import { AssessmentPlansService } from './assessment-plans.service';

@Module({
  controllers: [AssessmentPlansController],
  providers: [AssessmentPlansService],
  exports: [AssessmentPlansService],
})
export class AssessmentPlansModule {}
