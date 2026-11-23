CREATE TABLE "page_seo" (
	"path" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"og_type" text DEFAULT 'article' NOT NULL,
	"schema" jsonb,
	"published_at" timestamp with time zone,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wp_id" integer
);
