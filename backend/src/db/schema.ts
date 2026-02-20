import { pgTable, serial, varchar, text, integer, timestamp, date, boolean, jsonb, unique } from "drizzle-orm/pg-core";

// ============================================================================
// USERS & AUTH
// ============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  password_hash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  avatar_url: varchar("avatar_url", { length: 500 }),
  google_id: varchar("google_id", { length: 255 }).unique(),
  github_id: varchar("github_id", { length: 255 }).unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token_hash: varchar("token_hash", { length: 255 }).notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token_hash: varchar("token_hash", { length: 64 }).notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  full_name: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  nationality: varchar("nationality", { length: 100 }),
  linkedin_url: varchar("linkedin_url", { length: 500 }),
  github_url: varchar("github_url", { length: 500 }),
  portfolio_url: varchar("portfolio_url", { length: 500 }),
  summary: text("summary"),
  work_history: jsonb("work_history"),
  education: jsonb("education"),
  skills: jsonb("skills"),
  languages: jsonb("languages"),
  base_currency: varchar("base_currency", { length: 10 }).default("EUR"),
  salary_expectation_min: integer("salary_expectation_min"),
  salary_expectation_max: integer("salary_expectation_max"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const workAuthorizations = pgTable("work_authorizations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  country_code: varchar("country_code", { length: 3 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  expiry_date: date("expiry_date"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("work_authorizations_user_country_status").on(table.user_id, table.country_code, table.status),
]);

// ============================================================================
// COMPANIES
// ============================================================================

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  normalized_name: varchar("normalized_name", { length: 255 }).unique(),
  website: varchar("website", { length: 255 }),
  location: varchar("location", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const userCompanyNotes = pgTable("user_company_notes", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  company_id: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  notes: text("notes"),
  rating: integer("rating"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// SOURCES (job boards, recruiters, referrals, etc.)
// ============================================================================

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  normalized_name: varchar("normalized_name", { length: 100 }).unique(),
  url: varchar("url", { length: 500 }),
  logo_url: varchar("logo_url", { length: 500 }),
  category: varchar("category", { length: 50 }), // job_board, aggregator, company_site, government, recruiter, referral, community, other
  region: varchar("region", { length: 100 }), // global, EU, NL, ZA, etc.
  description: text("description"),
  is_active: boolean("is_active").default(true),
  usage_count: integer("usage_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export const userSourceNotes = pgTable("user_source_notes", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  source_id: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  notes: text("notes"),
  rating: integer("rating"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("user_source_notes_user_source").on(table.user_id, table.source_id),
]);

// ============================================================================
// APPLICATIONS (formerly positions + applications combined)
// ============================================================================

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  company_id: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  source_id: integer("source_id").references(() => sources.id, { onDelete: "set null" }),

  // Position info (formerly its own table)
  job_title: varchar("job_title", { length: 255 }).notNull(),
  job_url: varchar("job_url", { length: 500 }),
  job_description: text("job_description"),
  requirements: text("requirements"),
  location: varchar("location", { length: 255 }),
  remote_type: varchar("remote_type", { length: 50 }),

  // Salary tracking
  salary_advertised_min: integer("salary_advertised_min"),
  salary_advertised_max: integer("salary_advertised_max"),
  salary_offered: integer("salary_offered"),
  salary_currency: varchar("salary_currency", { length: 10 }).default("EUR"),
  salary_period: varchar("salary_period", { length: 20 }),

  // Visa/Eligibility
  visa_sponsorship: varchar("visa_sponsorship", { length: 50 }),
  role_country_code: varchar("role_country_code", { length: 3 }),
  visa_type_id: integer("visa_type_id").references(() => visaTypes.id, { onDelete: "set null" }),

  // Application meta
  status: varchar("status", { length: 50 }).default("bookmarked"),
  source_url: varchar("source_url", { length: 500 }),
  date_applied: date("date_applied"),
  date_responded: date("date_responded"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const statusHistory = pgTable("status_history", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  from_status: varchar("from_status", { length: 50 }),
  to_status: varchar("to_status", { length: 50 }).notNull(),
  changed_at: timestamp("changed_at").defaultNow(),
});

// ============================================================================
// CONTACTS & INTERACTIONS
// ============================================================================

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  company_id: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  linkedin: varchar("linkedin", { length: 500 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }),
  contact_id: integer("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  interaction_type: varchar("interaction_type", { length: 50 }).notNull(),
  direction: varchar("direction", { length: 10 }).default("inbound"),
  interaction_date: date("interaction_date").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  doc_type: varchar("doc_type", { length: 50 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  file_path: varchar("file_path", { length: 500 }),
  content: text("content"),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Junction table for many-to-many: applications <-> documents
export const applicationDocuments = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  document_id: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  doc_role: varchar("doc_role", { length: 50 }), // "cv_submitted", "cover_letter", "portfolio"
  attached_at: timestamp("attached_at").defaultNow(),
}, (table) => [
  unique("application_documents_pk").on(table.application_id, table.document_id),
]);

// ============================================================================
// FORM TEMPLATES (for browser extension)
// ============================================================================

export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  field_mappings: jsonb("field_mappings").notNull(),
  success_rate: integer("success_rate"),
  last_used: timestamp("last_used"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("form_templates_user_id_domain_unique").on(table.user_id, table.domain),
]);

// ============================================================================
// TAGS
// ============================================================================

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }),
}, (table) => [
  unique("tags_user_id_name_unique").on(table.user_id, table.name),
]);

export const applicationTags = pgTable("application_tags", {
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  tag_id: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
  unique("application_tags_pk").on(table.application_id, table.tag_id),
]);

// ============================================================================
// VISA REFERENCE DATA
// ============================================================================

export const visaTypes = pgTable("visa_types", {
  id: serial("id").primaryKey(),
  country_code: varchar("country_code", { length: 3 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  source_url: varchar("source_url", { length: 500 }),
  valid_from: date("valid_from").notNull(),
  valid_until: date("valid_until"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("visa_types_country_name_validfrom").on(table.country_code, table.name, table.valid_from),
]);

export const visaRequirements = pgTable("visa_requirements", {
  id: serial("id").primaryKey(),
  visa_type_id: integer("visa_type_id").references(() => visaTypes.id, { onDelete: "cascade" }).notNull(),
  requirement_type: varchar("requirement_type", { length: 50 }).notNull(),
  condition_label: varchar("condition_label", { length: 255 }),
  min_value: integer("min_value"),
  currency: varchar("currency", { length: 10 }),
  period: varchar("period", { length: 20 }),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================================================
// REMINDERS
// ============================================================================

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }),
  reminder_date: date("reminder_date").notNull(),
  message: text("message"),
  completed: boolean("completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});
