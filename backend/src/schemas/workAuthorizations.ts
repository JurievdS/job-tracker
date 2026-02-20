import { z } from "zod";

const statusEnum = z.enum([
  "citizen",
  "permanent_resident",
  "work_permit",
  "schengen_visa",
  "student_visa",
  "dependent_visa",
]);

/**
 * Work Authorization Schema
 * Schema for creating a new work authorization entry
 */
export const WorkAuthorizationSchema = z.object({
  country_code: z.string().length(3, "Country code must be 3 characters (ISO 3166-1 alpha-3)"),
  status: statusEnum,
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

export type NewWorkAuthorization = z.infer<typeof WorkAuthorizationSchema>;

export const UpdateWorkAuthorizationSchema = z.object({
  country_code: z.string().length(3).optional(),
  status: statusEnum.optional(),
  expiry_date: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type UpdateWorkAuthorization = z.infer<typeof UpdateWorkAuthorizationSchema>;
