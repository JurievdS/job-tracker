import { db } from "../db/index.js";
import { reminders, applications, companies } from "../db/schema.js";
import { eq, and, lte, asc, sql } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import type { NewReminder } from "../schemas/reminders.js";

// Infer types from the schema
type Reminder = typeof reminders.$inferSelect;

// Reminder with related entity names
export interface ReminderWithDetails {
  id: number;
  application_id: number | null;
  reminder_date: string | null;
  message: string | null;
  completed: boolean | null;
  created_at: Date | null;
  job_title: string;
  company_name: string | null;
}

/**
 * Reminder Service
 */
export class ReminderService {

  /**
   * Get all reminders for a user with optional pending filter
   */
  async findAll(
    userId: number,
    pending?: boolean
  ): Promise<ReminderWithDetails[]> {
    const baseQuery = db
      .select({
        id: reminders.id,
        application_id: reminders.application_id,
        reminder_date: reminders.reminder_date,
        message: reminders.message,
        completed: reminders.completed,
        created_at: reminders.created_at,
        job_title: applications.job_title,
        company_name: companies.name,
      })
      .from(reminders)
      .innerJoin(applications, eq(reminders.application_id, applications.id))
      .leftJoin(companies, eq(applications.company_id, companies.id))
      .orderBy(asc(reminders.reminder_date));

    if (pending) {
      return baseQuery.where(
        and(
          eq(reminders.completed, false),
          lte(reminders.reminder_date, sql`CURRENT_DATE`),
          eq(applications.user_id, userId)
        )
      );
    }

    return baseQuery.where(eq(applications.user_id, userId));
  }

  /**
   * Get a reminder by ID with related details
   */
  async findByIdWithDetails(
    reminderId: number,
    userId: number
  ): Promise<ReminderWithDetails> {
    const result = await db
      .select({
        id: reminders.id,
        application_id: reminders.application_id,
        reminder_date: reminders.reminder_date,
        message: reminders.message,
        completed: reminders.completed,
        created_at: reminders.created_at,
        job_title: applications.job_title,
        company_name: companies.name,
      })
      .from(reminders)
      .innerJoin(applications, eq(reminders.application_id, applications.id))
      .leftJoin(companies, eq(applications.company_id, companies.id))
      .where(
        and(eq(reminders.id, reminderId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Reminder not found");
    }

    return result[0];
  }

  /**
   * Get a reminder by ID (verifies ownership via application)
   */
  async findByIdOrThrow(reminderId: number, userId: number): Promise<Reminder> {
    const result = await db
      .select({
        id: reminders.id,
        application_id: reminders.application_id,
        reminder_date: reminders.reminder_date,
        message: reminders.message,
        completed: reminders.completed,
        created_at: reminders.created_at,
      })
      .from(reminders)
      .innerJoin(applications, eq(reminders.application_id, applications.id))
      .where(
        and(eq(reminders.id, reminderId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Reminder not found");
    }

    return result[0];
  }

  /**
   * Verify an application belongs to a user
   */
  private async verifyApplicationOwnership(
    applicationId: number,
    userId: number
  ): Promise<void> {
    const result = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(eq(applications.id, applicationId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Application not found");
    }
  }

  /**
   * Create a new reminder
   */
  async create(userId: number, data: NewReminder): Promise<Reminder> {
    // Verify application belongs to user
    await this.verifyApplicationOwnership(data.application_id, userId);

    const [reminder] = await db
      .insert(reminders)
      .values({
        application_id: data.application_id,
        reminder_date: data.reminder_date,
        message: data.message,
      })
      .returning();

    return reminder;
  }

  /**
   * Mark a reminder as completed
   */
  async markComplete(reminderId: number, userId: number): Promise<Reminder> {
    // Verify reminder exists and belongs to user
    await this.findByIdOrThrow(reminderId, userId);

    const [updated] = await db
      .update(reminders)
      .set({ completed: true })
      .where(eq(reminders.id, reminderId))
      .returning();

    return updated;
  }

  /**
   * Delete a reminder
   */
  async delete(reminderId: number, userId: number): Promise<void> {
    // Verify reminder exists and belongs to user
    await this.findByIdOrThrow(reminderId, userId);

    await db.delete(reminders).where(eq(reminders.id, reminderId));
  }
}

export const reminderService = new ReminderService();
