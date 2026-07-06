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
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { AuditService } from './audit.service';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@UseGuards(JwtAuthGuard)
@Controller('audit/documents')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string = 'OTHER',
  ) {
    if (!file) throw new Error('Ficheiro não fornecido');
    return this.audit.upload(user.id, file, type);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.audit.findByOwner(user.id);
  }

  @Roles('ADMIN')
  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.audit.findAll({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      status,
      search,
    });
  }

  @Roles('ADMIN')
  @Post(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyDocumentDto) {
    return this.audit.verify(id, dto.decision, dto.note);
  }
}
