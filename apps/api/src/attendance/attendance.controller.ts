import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { VerifyQrDto, RecordAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Roles('TEACHER')
  @Post('classes/:classId/sessions')
  createSession(@Param('classId', ParseIdPipe) classId: string) {
    return this.attendance.createSession(classId);
  }

  @Roles('STUDENT')
  @Post('sessions/:sessionId/verify-qr')
  verifyQr(@Body() dto: VerifyQrDto, @CurrentUser('id') studentId: string) {
    return this.attendance.verifyQr(studentId, dto.qrToken);
  }

  @Roles('TEACHER')
  @Post('classes/:classId/sessions/:sessionId/attendances')
  recordManual(
    @Param('classId', ParseIdPipe) classId: string,
    @Param('sessionId', ParseIdPipe) sessionId: string,
    @Body() dto: RecordAttendanceDto,
  ) {
    return this.attendance.recordManual(classId, sessionId, dto);
  }

  @Get('classes/:classId/sessions')
  listSessions(@Param('classId', ParseIdPipe) classId: string) {
    return this.attendance.listSessions(classId);
  }

  @Roles('TEACHER')
  @Get('sessions/:sessionId/attendances')
  listAttendances(@Param('sessionId', ParseIdPipe) sessionId: string) {
    return this.attendance.listAttendances(sessionId);
  }

  @Roles('TEACHER')
  @Patch('attendance/:id')
  updateAttendance(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendance.updateAttendance(id, dto.status);
  }
}
