import { z } from "zod";

/**
 * User Source Notes Schema
 * Schema for creating/updating personal notes on a source
 */
export const UserSourceNotesSchema = z.object({
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export type UserSourceNotesInput = z.infer<typeof UserSourceNotesSchema>;
