export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  fileName: string;
}

export interface IStorageDriver {
  save(file: Buffer, fileName: string, mimeType: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  resolveUrl(key: string): string;
}
