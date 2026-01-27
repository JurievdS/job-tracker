import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ReminderController } from "../controllers/ReminderController.js";
import { ReminderService } from "../services/ReminderService.js";

const router = Router();

// Initialize controller with service
const reminderService = new ReminderService();
const controller = new ReminderController(reminderService);

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
router.get("/", asyncHandler(controller.list));

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
router.get("/:id", asyncHandler(controller.getById));

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
router.post("/", asyncHandler(controller.create));

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
router.patch("/:id/complete", asyncHandler(controller.markComplete));

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
router.delete("/:id", asyncHandler(controller.delete));

export default router;
