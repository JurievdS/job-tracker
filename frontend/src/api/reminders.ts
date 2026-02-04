import { apiClient } from "./client";
import type {
  Reminder,
  ReminderWithDetails,
  CreateReminderDto,
} from "@/types/reminder";

/**
 * Reminders API Service
 *
 * Reminders are user-specific and linked to applications.
 */
export const remindersApi = {
  /**
   * List all reminders with optional pending filter
   * GET /reminders
   * @param pending If true, only return uncompleted reminders due today or earlier
   */
  list: async (pending?: boolean): Promise<ReminderWithDetails[]> => {
    const response = await apiClient.get<ReminderWithDetails[]>("/reminders", {
      params: pending !== undefined ? { pending } : undefined,
    });
    return response.data;
  },

  /**
   * Get a single reminder by ID
   * GET /reminders/:id
   */
  get: async (id: number): Promise<ReminderWithDetails> => {
    const response = await apiClient.get<ReminderWithDetails>(
      `/reminders/${id}`
    );
    return response.data;
  },

  /**
   * Create a new reminder
   * POST /reminders
   */
  create: async (data: CreateReminderDto): Promise<Reminder> => {
    const response = await apiClient.post<Reminder>("/reminders", data);
    return response.data;
  },

  /**
   * Mark a reminder as completed
   * PATCH /reminders/:id/complete
   */
  markComplete: async (id: number): Promise<Reminder> => {
    const response = await apiClient.patch<Reminder>(
      `/reminders/${id}/complete`
    );
    return response.data;
  },

  /**
   * Delete a reminder
   * DELETE /reminders/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/reminders/${id}`);
  },
};
