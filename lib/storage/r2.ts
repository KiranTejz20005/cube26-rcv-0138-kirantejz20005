import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider, StorageUploadResult } from './provider';

export class R2StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

    this.bucketName = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<StorageUploadResult> {
    const storageKey = `inspections/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        Body: file,
        ContentType: mimeType,
      })
    );

    const url = this.publicUrl ? `${this.publicUrl.replace(/\/$/, '')}/${storageKey}` : `/api/uploads/${storageKey}`;
    return { storageKey, url };
  }

  async getPublicUrl(storageKey: string): Promise<string> {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${storageKey}`;
    }
    return `/api/uploads/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      })
    );
  }
}
