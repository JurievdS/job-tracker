import { z } from "zod";

export const ApplicationSchema = z.object({
  position_id: z.number().int(),
  status: z.enum(["bookmarked","pending", "interview", "offer", "rejected"]),
  date_applied: z.string().optional(),
  notes: z.string().optional()
});

export type NewApplication = z.infer<typeof ApplicationSchema>;

export const UpdateApplicationSchema = ApplicationSchema.partial();

export type UpdateApplication = z.infer<typeof UpdateApplicationSchema>;