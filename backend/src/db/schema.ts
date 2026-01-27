import { pgTable, serial, varchar, text, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";

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

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  position_id: integer("position_id").references(() => positions.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).default("bookmarked"),
  date_applied: date("date_applied"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  website: varchar("website", { length: 255 }),
  location: varchar("location", { length: 255 }),
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

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  company_id: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  email: varchar("email", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }),
  contact_id: integer("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  interaction_type: varchar("interaction_type", { length: 50 }).notNull(),
  interaction_date: date("interaction_date").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  salary_min: integer("salary_min"),
  salary_max: integer("salary_max"),
  requirements: text("requirements"),
  job_url: varchar("job_url", { length: 500 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  application_id: integer("application_id").references(() => applications.id, { onDelete: "cascade" }),
  reminder_date: date("reminder_date").notNull(),
  message: text("message"),
  completed: boolean("completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});