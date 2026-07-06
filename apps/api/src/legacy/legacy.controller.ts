import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LegacyService } from './legacy.service';
import { UploadLegacyDto } from './dto/upload-legacy.dto';

@UseGuards(JwtAuthGuard)
@Controller('legacy')
export class LegacyController {
  constructor(private readonly legacy: LegacyService) {}

  @Roles('ADMIN')
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadLegacyDto) {
    return this.legacy.upload(file, dto.type, dto.mapping);
  }

  @Roles('ADMIN')
  @Get('imports')
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.legacy.findAll(page ? +page : 1, pageSize ? +pageSize : 20);
  }

  @Roles('ADMIN')
  @Get('imports/:id')
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.legacy.getStatus(id);
  }
}
