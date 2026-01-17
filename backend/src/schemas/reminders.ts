import { z } from "zod";

export const ReminderSchema = z.object({
  application_id: z.number().int(),
  reminder_date: z.string(),
  message: z.string().min(1, "Message is required"),
});

export type NewReminder = z.infer<typeof ReminderSchema>;

export const UpdateReminderSchema = ReminderSchema.partial();

export type UpdateReminder = z.infer<typeof UpdateReminderSchema>;