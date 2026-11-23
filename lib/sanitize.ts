import 'server-only';
import sanitizeHtml from 'sanitize-html';

/**
 * Every HTML body saved from the admin goes through this allow-list (stored-XSS protection even if an editor
 * account is compromised). Keeps what articles legitimately use: headings, lists, links, images, tables, quotes,
 * YouTube embeds, and harmless inline styles (alignment, colours, sizes) carried over from WordPress.
 */
const ALLOWED_STYLES: Record<string, RegExp[]> = {
  'text-align': [/^(left|right|center|justify|start|end)$/],
  direction: [/^(rtl|ltr)$/],
  color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
  'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
  'font-weight': [/^(normal|bold|[1-9]00)$/],
  'font-style': [/^(normal|italic)$/],
  'text-decoration': [/^(none|underline|line-through)$/],
  'font-size': [/^\d+(\.\d+)?(px|em|rem|%|pt)$/],
  width: [/^\d+(\.\d+)?(px|%)$/], height: [/^\d+(\.\d+)?(px|%)$/],
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'span', 'div', 'section', 'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'mark',
      'small', 'blockquote', 'q', 'cite', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot', 'tr',
      'th', 'td', 'caption', 'colgroup', 'col', 'iframe'],
    allowedAttributes: {
      '*': ['class', 'id', 'dir', 'style', 'title', 'lang'],
      a: ['href', 'target', 'rel', 'name'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan', 'scope'], col: ['span'], ol: ['start', 'type', 'reversed'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'loading'],
    },
    allowedStyles: { '*': ALLOWED_STYLES },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https', 'http', 'data'] },
    allowProtocolRelative: false,
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    transformTags: {
      // links opening a new tab must not leak window.opener; outbound links don't pass rank unless chosen
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') attribs.rel = Array.from(new Set([...(attribs.rel || '').split(/\s+/).filter(Boolean), 'noopener'])).join(' ');
        return { tagName, attribs };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { loading: 'lazy', decoding: 'async', ...attribs } }),
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  });
}

/** Plain text fields (titles, SEO strings): no tags, collapsed whitespace, length-capped. */
export const cleanText = (s: unknown, max = 500) =>
  String(s ?? '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

/** URL slug from Arabic or Latin text: letters/digits kept, everything else → single hyphens. */
export const slugify = (s: string) =>
  s.normalize('NFC').replace(/[ً-ٰٟـ]/g, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/, '');
