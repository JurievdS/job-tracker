import { Request, Response } from "express";
import { ReminderService } from "../services/ReminderService.js";
import { ReminderSchema } from "../schemas/reminders.js";

/**
 * Reminder Controller
 */
export class ReminderController {
  constructor(private reminderService: ReminderService) {}

  /**
   * GET /reminders
   * List all reminders for the authenticated user
   * with optional pending filter
   * Returns a list of reminders with related details
   */
  list = async (req: Request, res: Response) => {
    const pending = req.query.pending === "true";
    const reminders = await this.reminderService.findAll(
      req.userId!,
      pending || undefined
    );
    res.json(reminders);
  };

  /**
   * GET /reminders/:id
   * Get a single reminder by ID
   * Returns the reminder with related details
   */
  getById = async (req: Request, res: Response) => {
    const reminderId = Number(req.params.id);
    const reminder = await this.reminderService.findByIdWithDetails(
      reminderId,
      req.userId!
    );
    res.json(reminder);
  };

  /**
   * POST /reminders
   * Create a new reminder
   * Returns the created reminder
   */
  create = async (req: Request, res: Response) => {
    const data = ReminderSchema.parse(req.body);
    const reminder = await this.reminderService.create(req.userId!, data);
    res.status(201).json(reminder);
  };

  /**
   * PATCH /reminders/:id/complete
   * Mark a reminder as completed
   * Returns the updated reminder
   */
  markComplete = async (req: Request, res: Response) => {
    const reminderId = Number(req.params.id);
    const reminder = await this.reminderService.markComplete(
      reminderId,
      req.userId!
    );
    res.json(reminder);
  };

  /**
   * DELETE /reminders/:id
   * Delete a reminder
   * Returns 204 No Content on success
   */
  delete = async (req: Request, res: Response) => {
    const reminderId = Number(req.params.id);
    await this.reminderService.delete(reminderId, req.userId!);
    res.status(204).send();
  };
}
