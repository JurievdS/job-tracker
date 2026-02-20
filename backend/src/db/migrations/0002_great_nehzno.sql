CREATE TABLE "user_source_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"notes" text,
	"rating" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_source_notes_user_source" UNIQUE("user_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "visa_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"visa_type_id" integer NOT NULL,
	"requirement_type" varchar(50) NOT NULL,
	"condition_label" varchar(255),
	"min_value" integer,
	"currency" varchar(10),
	"period" varchar(20),
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visa_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"source_url" varchar(500),
	"valid_from" date NOT NULL,
	"valid_until" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "visa_types_country_name_validfrom" UNIQUE("country_code","name","valid_from")
);
--> statement-breakpoint
CREATE TABLE "work_authorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"status" varchar(50) NOT NULL,
	"expiry_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "work_authorizations_user_country_status" UNIQUE("user_id","country_code","status")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "visa_sponsorship" varchar(50);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "role_country_code" varchar(3);--> statement-breakpoint
ALTER TABLE "user_source_notes" ADD CONSTRAINT "user_source_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_source_notes" ADD CONSTRAINT "user_source_notes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visa_requirements" ADD CONSTRAINT "visa_requirements_visa_type_id_visa_types_id_fk" FOREIGN KEY ("visa_type_id") REFERENCES "public"."visa_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_authorizations" ADD CONSTRAINT "work_authorizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "visa_status";