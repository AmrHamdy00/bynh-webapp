import 'server-only';
import sharp from 'sharp';
import { mkdir, writeFile, access, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { db, schema as s } from './db';
import type { MediaSize } from './db/schema';

export const UPLOAD_ROOT = resolve(process.env.UPLOAD_DIR || join(process.cwd(), 'storage/uploads'));
export const MAX_UPLOAD = 10 * 1024 * 1024;
// same size names WordPress used, so old and new images look alike in the code
const SIZES: [string, number, number | null][] = [['thumbnail', 150, 150], ['medium', 300, null], ['medium_large', 768, null], ['large', 1030, null]];

const baseName = (name: string) =>
  name.replace(/\.[^.]+$/, '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
const exists = (p: string) => access(p).then(() => true, () => false);

/**
 * Stores an upload safely: the real type is detected from the bytes (not the name), images are decoded and
 * re-encoded (drops EXIF/GPS data and anything hidden in the file), SVG/HTML are refused, PDFs checked by signature.
 */
export async function storeUpload(file: File, alt: string, userId: number) {
  if (file.size > MAX_UPLOAD) throw new Error('الحد الأقصى 10 ميجابايت.');
  const buf = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  await mkdir(join(UPLOAD_ROOT, dir), { recursive: true });
  let base = baseName(file.name);
  const isPdf = buf.subarray(0, 5).toString('latin1') === '%PDF-';

  if (isPdf) {
    while (await exists(join(UPLOAD_ROOT, dir, `${base}.pdf`))) base += '-1';
    await writeFile(join(UPLOAD_ROOT, dir, `${base}.pdf`), buf, { mode: 0o644 });
    const [m] = await db.insert(s.media).values({ path: `/wp-content/uploads/${dir}/${base}.pdf`, mime: 'application/pdf', bytes: buf.length, alt, title: file.name, uploadedBy: userId }).returning();
    return m;
  }

  let meta: sharp.Metadata;
  try { meta = await sharp(buf, { limitInputPixels: 40_000_000 }).metadata(); } catch { throw new Error('نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF, PDF.'); }
  const fmt = meta.format === 'jpeg' || meta.format === 'png' || meta.format === 'webp' || meta.format === 'gif' ? meta.format : null;
  if (!fmt) throw new Error('نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF, PDF.');
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  while (await exists(join(UPLOAD_ROOT, dir, `${base}.${ext}`))) base += '-1';

  const encode = (img: sharp.Sharp) => (fmt === 'jpeg' ? img.jpeg({ quality: 82, mozjpeg: true }) : fmt === 'png' ? img.png({ compressionLevel: 9 })
    : fmt === 'webp' ? img.webp({ quality: 82 }) : img.gif());
  const src = () => sharp(buf, { animated: fmt === 'gif', limitInputPixels: 40_000_000 }).rotate();
  const main = await encode(src().resize({ width: 2560, withoutEnlargement: true })).toBuffer({ resolveWithObject: true });
  await writeFile(join(UPLOAD_ROOT, dir, `${base}.${ext}`), main.data, { mode: 0o644 });
  const sizes: Record<string, MediaSize> = {};
  for (const [name, w, h] of SIZES) {
    if (main.info.width <= w && !h) continue;
    const out = await encode(src().resize(h ? { width: w, height: h, fit: 'cover' } : { width: w, withoutEnlargement: true })).toBuffer({ resolveWithObject: true });
    const file2 = `${base}-${out.info.width}x${out.info.height}.${ext}`;
    await writeFile(join(UPLOAD_ROOT, dir, file2), out.data, { mode: 0o644 });
    sizes[name] = { path: `/wp-content/uploads/${dir}/${file2}`, width: out.info.width, height: out.info.height };
  }
  const [m] = await db.insert(s.media).values({
    path: `/wp-content/uploads/${dir}/${base}.${ext}`, mime: `image/${fmt}`, width: main.info.width, height: main.info.height, bytes: main.data.length,
    alt, title: file.name.slice(0, 200), sizes, uploadedBy: userId,
  }).returning();
  return m;
}

export async function deleteFiles(paths: string[]) {
  for (const p of paths) {
    const f = resolve(UPLOAD_ROOT, p.replace(/^\/wp-content\/uploads\//, ''));
    if (f.startsWith(UPLOAD_ROOT + '/')) await unlink(f).catch(() => {});
  }
}
