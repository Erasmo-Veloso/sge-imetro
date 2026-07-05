import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { LocalStorageDriver } from './local-storage.driver';
import { FilesController } from './files.controller';
import type { IStorageDriver } from './storage-driver.interface';

@Global()
@Module({
  providers: [
    {
      provide: 'STORAGE_DRIVER',
      inject: [ConfigService],
      useFactory: (config: ConfigService): IStorageDriver => {
        const driver = config.get<string>('STORAGE_DRIVER') ?? 'local';
        if (driver === 's3') {
          // TODO Sprint 4: S3-compat (MinIO/Cloudflare R2)
          return new LocalStorageDriver(config);
        }
        return new LocalStorageDriver(config);
      },
    },
    StorageService,
  ],
  controllers: [FilesController],
  exports: [StorageService],
})
export class StorageModule {}
