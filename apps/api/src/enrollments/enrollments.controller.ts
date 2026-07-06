import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, PaginationDto, ReviewEnrollmentDto } from './dto/enrollment.dto';

@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  // ── Student: own enrollments ──────────────────────────
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.enrollments.findByUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(user.id, dto);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadDocument(
    @Param('id', ParseIdPipe) id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('type')
    type: 'ID_DOCUMENT' | 'PAYMENT_PROOF' | 'TRANSCRIPT' | 'PHOTO' | 'OTHER' = 'OTHER',
  ) {
    if (!file) throw new Error('Ficheiro não fornecido');
    return this.enrollments.uploadDocument(id, user.id, file, type);
  }

  @Get(':id/documents')
  listDocuments(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.enrollments.listDocuments(id, user.id);
  }

  @Get(':id')
  show(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.enrollments.findOne(id, user.id, user.role);
  }

  // ── Admin/Teacher: list & review ─────────────────────
  @Get()
  list(@Query() query: PaginationDto, @CurrentUser() user: AuthUser) {
    return this.enrollments.findAll(query, user.role, user.id);
  }

  @Roles('ADMIN')
  @Post(':id/review')
  review(
    @Param('id', ParseIdPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewEnrollmentDto,
  ) {
    return this.enrollments.review(id, user.id, dto);
  }
}
