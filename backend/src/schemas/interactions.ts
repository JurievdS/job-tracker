import { z } from "zod";

export const InteractionSchema = z.object({
  application_id: z.number().int(),
  interaction_type: z.enum(["email", "phone_call", "in_person", "video_call", "other"]),
  interaction_date: z.string(),
  contact_id: z.number().int().optional(),
  notes: z.string().optional()
});

export type NewInteraction = z.infer<typeof InteractionSchema>;

export const UpdateInteractionSchema = InteractionSchema.partial();

export type UpdateInteraction = z.infer<typeof UpdateInteractionSchema>;