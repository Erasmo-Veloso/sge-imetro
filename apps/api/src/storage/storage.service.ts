import { Inject, Injectable } from '@nestjs/common';
import type { IStorageDriver, StoredFile } from './storage-driver.interface';

@Injectable()
export class StorageService {
  constructor(@Inject('STORAGE_DRIVER') private readonly driver: IStorageDriver) {}

  async save(file: Buffer, fileName: string, mimeType: string): Promise<StoredFile> {
    return this.driver.save(file, fileName, mimeType);
  }

  async delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }

  resolveUrl(key: string): string {
    return this.driver.resolveUrl(key);
  }
}
