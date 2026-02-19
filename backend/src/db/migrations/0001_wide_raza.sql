CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"normalized_name" varchar(100),
	"url" varchar(500),
	"logo_url" varchar(500),
	"category" varchar(50),
	"region" varchar(100),
	"description" text,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "sources_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "source_id" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "source";