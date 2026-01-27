import { z } from "zod";

/** * Application Schema
 * Schema for creating or updating a job application
 */
export const ApplicationSchema = z.object({
  position_id: z.number().int(),
  status: z.enum(["bookmarked", "applied", "phone_screen", "technical", "final_round", "offer", "rejected"]),
  date_applied: z.string().optional(),
  notes: z.string().optional()
});

export type NewApplication = z.infer<typeof ApplicationSchema>;

export const UpdateApplicationSchema = ApplicationSchema.partial();

export type UpdateApplication = z.infer<typeof UpdateApplicationSchema>;

/**
 * Quick Create Application Schema
 * Schema for quickly creating an application with minimal info
 */
export const QuickCreateApplicationSchema = z.object({
  company_name: z.string().min(1),
  position_title: z.string().min(1),
  status: z.enum(["bookmarked", "applied", "phone_screen", "technical", "final_round", "offer", "rejected"]),
  date_applied: z.string().optional(),
  notes: z.string().optional(),
});

export type QuickCreateApplication = z.infer<typeof QuickCreateApplicationSchema>;