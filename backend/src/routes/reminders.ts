import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { reminders, applications, positions, companies } from "../db/schema.js";
import { eq, and, lte, asc, sql } from "drizzle-orm";
import { ReminderSchema, UpdateReminderSchema } from "../schemas/reminders.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Reminder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         application_id:
 *           type: integer
 *         reminder_date:
 *           type: string
 *           format: date
 *         message:
 *           type: string
 *         completed:
 *           type: boolean
 */

/**
 * @swagger
 * /reminders:
 *   get:
 *     summary: Get all reminders
 *     tags: [Reminders]
 *     parameters:
 *       - in: query
 *         name: pending
 *         schema:
 *           type: boolean
 *         description: Show only pending reminders
 *     responses:
 *       200:
 *         description: List of reminders
 */
router.get("/", asyncHandler(async (req: Request, res: Response) => {
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

  const result = req.query.pending === "true"
    ? await baseQuery.where(
        and(
          eq(reminders.completed, false),
          lte(reminders.reminder_date, sql`CURRENT_DATE`)
        )
      )
    : await baseQuery;

  res.json(result);
}));

/**
 * @swagger
 * /reminders/{id}:
 *   get:
 *     summary: Get a reminder by ID
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reminder found
 *       404:
 *         description: Reminder not found
 */
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
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
    .where(eq(reminders.id, Number(req.params.id)));

  if (result.length === 0) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  res.json(result[0]);
}));

/**
 * @swagger
 * /reminders:
 *   post:
 *     summary: Create a reminder
 *     tags: [Reminders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reminder'
 *     responses:
 *       201:
 *         description: Reminder created
 */
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const data = ReminderSchema.parse(req.body);

  const result = await db
    .insert(reminders)
    .values({
      application_id: data.application_id,
      reminder_date: data.reminder_date,
      message: data.message,
    })
    .returning();

  res.status(201).json(result[0]);
}));

/**
 * @swagger
 * /reminders/{id}/complete:
 *   patch:
 *     summary: Mark reminder as completed
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reminder completed
 *       404:
 *         description: Reminder not found
 */
router.patch("/:id/complete", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .update(reminders)
    .set({ completed: true })
    .where(eq(reminders.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  res.json(result[0]);
}));

/**
 * @swagger
 * /reminders/{id}:
 *   delete:
 *     summary: Delete a reminder
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Reminder deleted
 *       404:
 *         description: Reminder not found
 */
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .delete(reminders)
    .where(eq(reminders.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  res.status(204).send();
}));

export default router;
