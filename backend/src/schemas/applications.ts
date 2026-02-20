import { z } from "zod";

const statusEnum = z.enum([
  "bookmarked",
  "applied",
  "phone_screen",
  "technical",
  "final_round",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
]);

const remoteTypeEnum = z.enum(["onsite", "hybrid", "remote"]);

const salaryPeriodEnum = z.enum(["hourly", "monthly", "annual"]);

// Source can be any string - the service will find or create the source record
const sourceString = z.string().min(1, "Source is required").max(100);

/**
 * Application Schema
 * Schema for creating a new job application
 */
export const ApplicationSchema = z.object({
  company_id: z.number().int().optional(),
  company_name: z.string().min(1).optional(),

  // Position info
  job_title: z.string().min(1, "Job title is required"),
  job_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  job_description: z.string().optional(),
  requirements: z.string().optional(),
  location: z.string().optional(),
  remote_type: remoteTypeEnum.optional(),

  // Salary tracking
  salary_advertised_min: z.number().int().optional(),
  salary_advertised_max: z.number().int().optional(),
  salary_currency: z.string().max(10).optional(),
  salary_period: salaryPeriodEnum.optional(),

  // Visa/Eligibility
  visa_sponsorship: z.enum(["yes", "no", "unknown"]).optional(),
  role_country_code: z.string().length(3).optional(),
  visa_type_id: z.number().int().optional(),

  // Application meta
  status: statusEnum.default("bookmarked"),
  source: sourceString,
  source_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  date_applied: z.string().optional(),
  notes: z.string().optional(),
});

export type NewApplication = z.infer<typeof ApplicationSchema>;

export const UpdateApplicationSchema = z.object({
  company_id: z.number().int().optional(),

  // Position info
  job_title: z.string().min(1).optional(),
  job_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  job_description: z.string().optional(),
  requirements: z.string().optional(),
  location: z.string().optional(),
  remote_type: remoteTypeEnum.optional(),

  // Salary tracking
  salary_advertised_min: z.number().int().optional(),
  salary_advertised_max: z.number().int().optional(),
  salary_offered: z.number().int().optional(),
  salary_currency: z.string().max(10).optional(),
  salary_period: salaryPeriodEnum.optional(),

  // Visa/Eligibility
  visa_sponsorship: z.enum(["yes", "no", "unknown"]).optional(),
  role_country_code: z.string().length(3).optional(),
  visa_type_id: z.number().int().nullable().optional(),

  // Application meta
  status: statusEnum.optional(),
  source: sourceString.optional(),
  source_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  date_applied: z.string().optional(),
  date_responded: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateApplication = z.infer<typeof UpdateApplicationSchema>;

/**
 * Quick Create Application Schema
 * Schema for quickly creating an application with minimal info
 */
export const QuickCreateApplicationSchema = z.object({
  company_name: z.string().min(1),
  job_title: z.string().min(1),
  source: sourceString,
  status: statusEnum.default("bookmarked"),
  job_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  date_applied: z.string().optional(),
  notes: z.string().optional(),
});

export type QuickCreateApplication = z.infer<typeof QuickCreateApplicationSchema>;

/**
 * Update Status Schema
 */
export const UpdateStatusSchema = z.object({
  status: statusEnum,
});

export type UpdateStatus = z.infer<typeof UpdateStatusSchema>;
