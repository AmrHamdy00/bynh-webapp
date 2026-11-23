/**
 * PostgreSQL schema (Drizzle ORM). Replaces WordPress as the source of the blog, and holds the admin users,
 * sessions, audit log and first-party analytics.
 * Migrations: `npm run db:generate` (writes drizzle/*.sql) → `npm run db:migrate`.
 */
import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, serial, bigserial, integer, smallint, text, boolean, timestamp, jsonb, primaryKey, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/* ───────────── Admin users & security ───────────── */

export const roleEnum = pgEnum('role', ['admin', 'editor', 'author']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),                 // stored lower-case
  displayName: text('display_name').notNull(),
  email: text('email'),
  passwordHash: text('password_hash').notNull(),        // argon2id
  role: roleEnum('role').notNull().default('author'),
  totpSecret: text('totp_secret'),                      // AES-256-GCM encrypted with APP_SECRET
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  totpLastStep: integer('totp_last_step'),              // blocks re-use of the same 30 s code
  failedCount: smallint('failed_count').notNull().default(0),
  lockedUntil: ts('locked_until'),
  disabled: boolean('disabled').notNull().default(false),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  passwordChangedAt: ts('password_changed_at').notNull().defaultNow(),
  lastLoginAt: ts('last_login_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('users_username_uq').on(t.username)]);

export const recoveryCodes = pgTable('recovery_codes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),                // sha256 (codes are random, high-entropy)
  usedAt: ts('used_at'),
}, (t) => [index('recovery_user_idx').on(t.userId)]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),                          // sha256(token) — the raw token only lives in the cookie
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stage: text('stage', { enum: ['mfa', 'setup', 'full'] }).notNull(), // mfa = password ok, waiting for TOTP
  createdAt: ts('created_at').notNull().defaultNow(),
  lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
  expiresAt: ts('expires_at').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

export const loginAttempts = pgTable('login_attempts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  username: text('username'),
  ip: text('ip'),
  kind: text('kind', { enum: ['password', 'totp', 'recovery'] }).notNull(),
  success: boolean('success').notNull(),
  at: ts('at').notNull().defaultNow(),
}, (t) => [index('attempts_ip_at_idx').on(t.ip, t.at), index('attempts_user_at_idx').on(t.username, t.at)]);

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),                     // e.g. login, login_failed, post.update, user.create
  entity: text('entity'),
  entityId: text('entity_id'),
  data: jsonb('data'),
  ip: text('ip'),
  at: ts('at').notNull().defaultNow(),
}, (t) => [index('audit_at_idx').on(t.at)]);

/* ───────────── Content ───────────── */

export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'published', 'trash']);

/** SEO fields per post/page — same set Yoast stored, so nothing search engines saw is lost. */
export type Seo = {
  title?: string; description?: string; canonical?: string; robots?: string;
  ogTitle?: string; ogDescription?: string; ogImage?: { url: string; width?: number; height?: number; type?: string };
  twitterTitle?: string; twitterDescription?: string; twitterImage?: string; focusKeyword?: string;
};

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),                        // WordPress ids are kept for imported posts
  slug: text('slug').notNull(),                         // decoded Arabic slug (URL: /<slug>/)
  status: postStatusEnum('status').notNull().default('draft'),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull().default(''),
  content: text('content').notNull().default(''),       // sanitized HTML
  coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull().default('فريق بينه'),
  seo: jsonb('seo').$type<Seo>().notNull().default({}),
  schema: jsonb('schema'),                              // imported Yoast JSON-LD graph (null → generated)
  readingMinutes: smallint('reading_minutes'),
  publishedAt: ts('published_at'),
  modifiedAt: ts('modified_at').notNull().defaultNow(),
  createdAt: ts('created_at').notNull().defaultNow(),
  wpId: integer('wp_id'),
}, (t) => [
  uniqueIndex('posts_slug_uq').on(t.slug),
  index('posts_pub_idx').on(t.status, t.publishedAt),
]);

export const postRevisions = pgTable('post_revisions', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt').notNull(),
  seo: jsonb('seo').$type<Seo>().notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  at: ts('at').notNull().defaultNow(),
}, (t) => [index('rev_post_idx').on(t.postId, t.at)]);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
}, (t) => [uniqueIndex('tags_slug_uq').on(t.slug)]);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
}, (t) => [uniqueIndex('categories_slug_uq').on(t.slug)]);

export const postTags = pgTable('post_tags', {
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.postId, t.tagId] })]);

export const postCategories = pgTable('post_categories', {
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.postId, t.categoryId] })]);

export type MediaSize = { path: string; width: number; height: number };
export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  path: text('path').notNull(),                         // public path, e.g. /wp-content/uploads/2024/06/x.jpg
  mime: text('mime').notNull(),
  width: integer('width'),
  height: integer('height'),
  bytes: integer('bytes'),
  alt: text('alt').notNull().default(''),
  title: text('title').notNull().default(''),
  sizes: jsonb('sizes').$type<Record<string, MediaSize>>().notNull().default({}),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: ts('created_at').notNull().defaultNow(),
  wpId: integer('wp_id'),
}, (t) => [uniqueIndex('media_path_uq').on(t.path)]);

export const redirects = pgTable('redirects', {
  id: serial('id').primaryKey(),
  fromPath: text('from_path').notNull(),                // decoded path, e.g. /old-slug/
  toPath: text('to_path').notNull().default(''),        // '' with code 410 = gone
  code: smallint('code').notNull().default(301),
  hits: integer('hits').notNull().default(0),
  lastHitAt: ts('last_hit_at'),
  note: text('note'),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('redirects_from_uq').on(t.fromPath)]);

/* ───────────── Analytics (first-party, cookieless) ───────────── */

export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  at: ts('at').notNull().defaultNow(),
  type: text('type').notNull(),                         // pageview | read | click | engage | notfound | form
  path: text('path').notNull(),
  title: text('title'),
  referrerHost: text('referrer_host'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  visitor: text('visitor').notNull(),                   // daily-rotating salted hash — not reversible, no cookie
  session: text('session'),                             // per-tab random id (sessionStorage), not personal
  device: text('device'),
  browser: text('browser'),
  os: text('os'),
  country: text('country'),
  label: text('label'),                                 // click target / form name
  value: integer('value'),                              // scroll % / seconds engaged
}, (t) => [
  index('events_at_idx').on(t.at),
  index('events_type_at_idx').on(t.type, t.at),
  index('events_path_idx').on(t.path, t.at),
  index('events_session_idx').on(t.session),
]);

export const funnels = pgTable('funnels', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  steps: jsonb('steps').$type<{ type: 'pageview' | 'click' | 'form'; match: string; label: string }[]>().notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: ts('updated_at').notNull().default(sql`now()`),
});

/* ───────────── Form submissions (e.g. /التسجيل/) ───────────── */

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  form: text('form').notNull(),
  data: jsonb('data').$type<Record<string, string>>().notNull(),
  status: text('status', { enum: ['new', 'contacted', 'closed', 'spam'] }).notNull().default('new'),
  at: ts('at').notNull().defaultNow(),
}, (t) => [index('leads_at_idx').on(t.at)]);

/* ───────────── SEO of the coded pages (home, about, services…) — imported from Yoast, editable in admin ───────────── */

export const pageSeo = pgTable('page_seo', {
  path: text('path').primaryKey(),                      // decoded, e.g. /about-us/ or /استشارات-قانونية/
  name: text('name').notNull(),
  seo: jsonb('seo').$type<Seo>().notNull().default({}),
  ogType: text('og_type').notNull().default('article'),
  schema: jsonb('schema'),
  publishedAt: ts('published_at'),
  modifiedAt: ts('modified_at').notNull().defaultNow(),
  wpId: integer('wp_id'),
});
