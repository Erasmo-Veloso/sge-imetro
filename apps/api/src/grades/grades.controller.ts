import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { GradesService } from './grades.service';
import { BulkRecordGradesDto } from './dto/bulk-record-grades.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Roles('TEACHER')
  @Post('classes/:classId/grades')
  bulkRecord(
    @Param('classId', ParseIdPipe) classId: string,
    @Body() dto: BulkRecordGradesDto,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.grades.bulkRecord(classId, dto, teacherId);
  }

  @Get('registrations/:registrationId/grades')
  findByRegistration(@Param('registrationId', ParseIdPipe) registrationId: string) {
    return this.grades.findByRegistration(registrationId);
  }

  @Get('registrations/:registrationId/average')
  calculateAverage(@Param('registrationId', ParseIdPipe) registrationId: string) {
    return this.grades.calculateAverage(registrationId);
  }
}
