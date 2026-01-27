CREATE TABLE "user_company_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"notes" text,
	"rating" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "companies_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_company_notes" ADD CONSTRAINT "user_company_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_company_notes" ADD CONSTRAINT "user_company_notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "rating";--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_name_unique" UNIQUE("name");