import { StorageProvider } from './provider';
import { LocalStorageProvider } from './local';
import { R2StorageProvider } from './r2';

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageInstance) return storageInstance;

  const hasR2 = Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );

  if (hasR2) {
    storageInstance = new R2StorageProvider();
  } else {
    storageInstance = new LocalStorageProvider();
  }

  return storageInstance;
}
