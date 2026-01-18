-- Create users table first
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"name" varchar(255),
	"avatar_url" varchar(500),
	"google_id" varchar(255),
	"github_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
-- Add user_id column as nullable first
ALTER TABLE "companies" ADD COLUMN "user_id" integer;
--> statement-breakpoint
-- Create a migration user for existing data
INSERT INTO "users" ("email", "name") VALUES ('migration@system.local', 'Migration User');
--> statement-breakpoint
-- Backfill existing companies with the migration user
UPDATE "companies" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'migration@system.local');
--> statement-breakpoint
-- Now make user_id NOT NULL
ALTER TABLE "companies" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;