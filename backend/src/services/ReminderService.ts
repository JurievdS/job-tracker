import { db } from "../db/index.js";
import { reminders, applications, positions, companies } from "../db/schema.js";
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
  position_title: string;
  company_name: string;
}

/**
 * Reminder Service
 */
export class ReminderService {

  /**
   * Get all reminders for a user with optional pending filter
   * @param userId ID of the user
   * @param pending If true, only return uncompleted reminders due today or earlier
   * @return List of reminders with related details
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
        position_title: positions.title,
        company_name: companies.name,
      })
      .from(reminders)
      .innerJoin(applications, eq(reminders.application_id, applications.id))
      .innerJoin(positions, eq(applications.position_id, positions.id))
      .innerJoin(companies, eq(positions.company_id, companies.id))
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
   * @param reminderId ID of the reminder
   * @param userId ID of the user
   * @return Reminder with related details
   * @throws NotFoundError if reminder doesn't exist or doesn't belong to user
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
        position_title: positions.title,
        company_name: companies.name,
      })
      .from(reminders)
      .innerJoin(applications, eq(reminders.application_id, applications.id))
      .innerJoin(positions, eq(applications.position_id, positions.id))
      .innerJoin(companies, eq(positions.company_id, companies.id))
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
   * @param reminderId ID of the reminder
   * @param userId ID of the user
   * @return Reminder
   * @throws NotFoundError if reminder doesn't exist or doesn't belong to user
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
   * @param applicationId ID of the application
   * @param userId ID of the user
   * @return void
   * @throws NotFoundError if application doesn't exist or doesn't belong to user
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
   * @param userId ID of the user
   * @param data New reminder data
   * @return Created reminder
   * @throws NotFoundError if application doesn't belong to user
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
   * @param reminderId ID of the reminder
   * @param userId ID of the user
   * @return Updated reminder
   * @throws NotFoundError if reminder doesn't exist or doesn't belong to user
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
   * @param reminderId ID of the reminder
   * @param userId ID of the user
   * @return void
   * @throws NotFoundError if reminder doesn't exist or doesn't belong to user
   */
  async delete(reminderId: number, userId: number): Promise<void> {
    // Verify reminder exists and belongs to user
    await this.findByIdOrThrow(reminderId, userId);

    await db.delete(reminders).where(eq(reminders.id, reminderId));
  }
}

export const reminderService = new ReminderService();
