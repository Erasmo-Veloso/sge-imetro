import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import type { IStorageDriver, StoredFile } from './storage-driver.interface';

/**
 * Local filesystem storage driver. Files are stored under STORAGE_LOCAL_DIR
 * and served via Nest's ServeStatic or a custom route. In dev, we resolve URLs
 * relative to the API origin (/storage/<key>).
 */
@Injectable()
export class LocalStorageDriver implements IStorageDriver {
  private readonly logger = new Logger('Storage(Local)');
  private readonly baseDir: string;

  constructor(config: ConfigService) {
    this.baseDir = resolve(config.get<string>('STORAGE_LOCAL_DIR') ?? './storage');
  }

  async save(file: Buffer, fileName: string, mimeType: string): Promise<StoredFile> {
    const hash = createHash('sha256').update(file).digest('hex').slice(0, 16);
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
    const key = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${hash}${ext}`;
    const absPath = join(this.baseDir, key);

    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, file);
    this.logger.debug(`saved ${key} (${file.length} bytes)`);

    return {
      key,
      url: this.resolveUrl(key),
      size: file.length,
      mimeType,
      fileName,
    };
  }

  async delete(key: string): Promise<void> {
    const absPath = this.resolveKey(key);
    try {
      await unlink(absPath);
    } catch {
      this.logger.debug(`delete skipped for ${key}`);
    }
  }

  async read(key: string): Promise<Buffer> {
    const absPath = this.resolveKey(key);
    return readFile(absPath);
  }

  resolveUrl(key: string): string {
    return `/storage/${key.split(sep).join('/')}`;
  }

  private resolveKey(key: string): string {
    const normalized = key.split('/').join(sep);
    return join(this.baseDir, normalized);
  }
}
