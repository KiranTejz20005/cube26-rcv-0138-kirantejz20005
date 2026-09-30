import fs from 'fs/promises';
import path from 'path';
import { StorageProvider, StorageUploadResult } from './provider';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Ignore if directory already exists
    }
  }

  async upload(file: Buffer, filename: string): Promise<StorageUploadResult> {
    await this.ensureDir();
    const uniqueName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    await fs.writeFile(filePath, file);

    const storageKey = `uploads/${uniqueName}`;
    const url = `/uploads/${uniqueName}`;

    return { storageKey, url };
  }

  async getPublicUrl(storageKey: string): Promise<string> {
    if (storageKey.startsWith('/')) return storageKey;
    if (storageKey.startsWith('http')) return storageKey;
    return `/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    const filename = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
