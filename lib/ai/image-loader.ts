import fs from 'fs/promises';
import path from 'path';
import { ImageInput } from './provider';

export interface LoadedImagePart {
  buffer: Buffer;
  base64: string;
  dataUrl: string;
  mimeType: string;
}

export async function loadImagePart(img: ImageInput): Promise<LoadedImagePart> {
  let buffer: Buffer | null = null;
  let mimeType = 'image/jpeg';

  const cleanUrl = (img.url || '').toLowerCase();
  if (cleanUrl.endsWith('.png')) mimeType = 'image/png';
  else if (cleanUrl.endsWith('.webp')) mimeType = 'image/webp';
  else if (cleanUrl.endsWith('.gif')) mimeType = 'image/gif';

  // 1. Try local file system resolution
  const filename = path.basename(img.storageKey || img.url);
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'uploads', filename),
    path.join(process.cwd(), 'public', img.storageKey || ''),
    path.join(process.cwd(), 'public', (img.url || '').replace(/^\//, '')),
  ];

  for (const p of possiblePaths) {
    try {
      buffer = await fs.readFile(/* turbopackIgnore: true */ p);
      if (buffer && buffer.length > 0) break;
    } catch {
      // Continue trying next path
    }
  }

  // 2. If HTTP URL and not local
  if (!buffer && (img.url.startsWith('http://') || img.url.startsWith('https://'))) {
    try {
      const res = await fetch(img.url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        const headerMime = res.headers.get('content-type');
        if (headerMime) mimeType = headerMime;
      }
    } catch (err) {
      console.warn(`Could not fetch image from URL ${img.url}:`, err);
    }
  }

  if (!buffer || buffer.length === 0) {
    throw new Error(`Failed to load uploaded image binary data for image ID "${img.id}" (storageKey: "${img.storageKey}", url: "${img.url}").`);
  }

  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    buffer,
    base64,
    dataUrl,
    mimeType,
  };
}
