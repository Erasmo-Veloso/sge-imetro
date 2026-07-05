import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageDriver } from '../storage/local-storage.driver';
import type { Response } from 'express';

/**
 * Serves uploaded files from local storage in dev.
 * In production, prefer a CDN or S3 presigned URL.
 */
@Controller('storage')
export class FilesController {
  private readonly driver: LocalStorageDriver;

  constructor(config: ConfigService) {
    this.driver = new LocalStorageDriver(config);
  }

  @Get('*path')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async serve(@Param('path') path: string | string[], @Res() res: Response) {
    const key = Array.isArray(path) ? path.join('/') : path;
    try {
      const buffer = await this.driver.read(key);
      res.send(buffer);
    } catch {
      throw new NotFoundException('Ficheiro não encontrado');
    }
  }
}
