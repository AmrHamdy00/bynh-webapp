import 'server-only';
import { like } from 'drizzle-orm';
import sharp, { type Metadata as SharpMeta, type Sharp } from 'sharp';
import { mkdir, writeFile, access, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { put, del } from '@vercel/blob';
import { db, schema as s } from './db';

/**
 * Where uploads go: the local folder (own server, served by nginx at /wp-content/uploads/…), or Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set (Vercel has no persistent disk). Blob files keep the same YYYY/MM/name layout.
 */
const BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
async function save(rel: string, data: Buffer, contentType: string): Promise<string> {
  if (BLOB) {
    const b = await put(`wp-content/uploads/${rel}`, data, { access: 'public', contentType, addRandomSuffix: false, allowOverwrite: false });
    return b.url;
  }
  await writeFile(join(UPLOAD_ROOT, rel), data, { mode: 0o644 });
  return `/wp-content/uploads/${rel}`;
}
const taken = async (rel: string) => {
  if (BLOB) return (await db.select({ id: s.media.id }).from(s.media).where(like(s.media.path, `%/wp-content/uploads/${rel}`)).limit(1)).length > 0;
  return exists(join(UPLOAD_ROOT, rel));
};
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
  if (!BLOB) await mkdir(join(UPLOAD_ROOT, dir), { recursive: true });
  let base = baseName(file.name);
  const isPdf = buf.subarray(0, 5).toString('latin1') === '%PDF-';

  if (isPdf) {
    while (await taken(`${dir}/${base}.pdf`)) base += '-1';
    const url = await save(`${dir}/${base}.pdf`, buf, 'application/pdf');
    const [m] = await db.insert(s.media).values({ path: url, mime: 'application/pdf', bytes: buf.length, alt, title: file.name, uploadedBy: userId }).returning();
    return m;
  }

  let meta: SharpMeta;
  try { meta = await sharp(buf, { limitInputPixels: 40_000_000 }).metadata(); } catch { throw new Error('نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF, PDF.'); }
  const fmt = meta.format === 'jpeg' || meta.format === 'png' || meta.format === 'webp' || meta.format === 'gif' ? meta.format : null;
  if (!fmt) throw new Error('نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF, PDF.');
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  while (await taken(`${dir}/${base}.${ext}`)) base += '-1';

  const encode = (img: Sharp) => (fmt === 'jpeg' ? img.jpeg({ quality: 82, mozjpeg: true }) : fmt === 'png' ? img.png({ compressionLevel: 9 })
    : fmt === 'webp' ? img.webp({ quality: 82 }) : img.gif());
  const src = () => sharp(buf, { animated: fmt === 'gif', limitInputPixels: 40_000_000 }).rotate();
  const main = await encode(src().resize({ width: 2560, withoutEnlargement: true })).toBuffer({ resolveWithObject: true });
  const mainUrl = await save(`${dir}/${base}.${ext}`, main.data, `image/${fmt}`);
  const sizes: Record<string, MediaSize> = {};
  for (const [name, w, h] of SIZES) {
    if (main.info.width <= w && !h) continue;
    const out = await encode(src().resize(h ? { width: w, height: h, fit: 'cover' } : { width: w, withoutEnlargement: true })).toBuffer({ resolveWithObject: true });
    const file2 = `${base}-${out.info.width}x${out.info.height}.${ext}`;
    sizes[name] = { path: await save(`${dir}/${file2}`, out.data, `image/${fmt}`), width: out.info.width, height: out.info.height };
  }
  const [m] = await db.insert(s.media).values({
    path: mainUrl, mime: `image/${fmt}`, width: main.info.width, height: main.info.height, bytes: main.data.length,
    alt, title: file.name.slice(0, 200), sizes, uploadedBy: userId,
  }).returning();
  return m;
}

export async function deleteFiles(paths: string[]) {
  const blobs = paths.filter((p) => /^https:\/\//.test(p));
  if (blobs.length && BLOB) await del(blobs).catch(() => {});
  for (const p of paths.filter((x) => x.startsWith('/'))) {
    const f = resolve(UPLOAD_ROOT, p.replace(/^\/wp-content\/uploads\//, ''));
    if (f.startsWith(UPLOAD_ROOT + '/')) await unlink(f).catch(() => {});
  }
}
