/**
 * Serves uploaded media at the same addresses WordPress used (/wp-content/uploads/YYYY/MM/file.ext).
 * In production nginx serves UPLOAD_DIR directly (faster); this handler is the fallback and the dev server path.
 * MEDIA_FALLBACK_ORIGIN (e.g. https://bynh.sa): files not on disk are redirected there — used by the staging copy.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { Readable } from 'node:stream';

const ROOT = resolve(process.env.UPLOAD_DIR || join(process.cwd(), 'storage/uploads'));
const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon',
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path.map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
  if (parts.some((p) => p === '..' || p.includes('\0') || p.includes('/') || p.includes('\\'))) return new Response('Not found', { status: 404 });
  const file = resolve(ROOT, ...parts);
  if (!file.startsWith(ROOT + '/')) return new Response('Not found', { status: 404 });
  const type = TYPES[extname(file).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const st = await stat(file);
    if (!st.isFile()) throw new Error();
    return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
      headers: {
        'Content-Type': type, 'Content-Length': String(st.size), 'Cache-Control': 'public, max-age=31536000, immutable',
        'Last-Modified': st.mtime.toUTCString(), 'X-Content-Type-Options': 'nosniff',
        ...(type === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {}),
      },
    });
  } catch {
    // test copies without the media folder (e.g. Vercel staging) load images from the live site
    const origin = process.env.MEDIA_FALLBACK_ORIGIN;
    if (origin) return Response.redirect(`${origin.replace(/\/$/, '')}/wp-content/uploads/${parts.map(encodeURIComponent).join('/')}`, 302);
    return new Response('Not found', { status: 404 });
  }
}
