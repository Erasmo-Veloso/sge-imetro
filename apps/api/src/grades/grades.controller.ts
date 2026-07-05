import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
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
  @Post('classes/:classId/sessions/:sessionId/grades')
  bulkRecord(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: BulkRecordGradesDto,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.grades.bulkRecord(classId, sessionId, dto, teacherId);
  }

  @Get('registrations/:registrationId/grades')
  findByRegistration(@Param('registrationId', ParseUUIDPipe) registrationId: string) {
    return this.grades.findByRegistration(registrationId);
  }

  @Get('registrations/:registrationId/average')
  calculateAverage(@Param('registrationId', ParseUUIDPipe) registrationId: string) {
    return this.grades.calculateAverage(registrationId);
  }
}
