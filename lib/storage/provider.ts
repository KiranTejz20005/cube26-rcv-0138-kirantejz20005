export interface StorageUploadResult {
  storageKey: string;
  url: string;
}

export interface StorageProvider {
  /**
   * Upload a file buffer to storage.
   */
  upload(file: Buffer, filename: string, mimeType: string): Promise<StorageUploadResult>;

  /**
   * Get the public URL for a stored item.
   */
  getPublicUrl(storageKey: string): Promise<string>;

  /**
   * Delete a file from storage.
   */
  delete(storageKey: string): Promise<void>;
}
