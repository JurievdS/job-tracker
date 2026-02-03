ALTER TABLE "companies" DROP CONSTRAINT "companies_name_unique";--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "normalized_name" varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_normalized_name_unique" UNIQUE("normalized_name");