import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ApplicationController } from "../controllers/ApplicationController.js";
import { ApplicationService } from "../services/ApplicationService.js";

const router = Router();

// Initialize controller with service
const applicationService = new ApplicationService();
const controller = new ApplicationController(applicationService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         position_id:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [bookmarked, applied, phone_screen, technical, final_round, offer, rejected]
 *         date_applied:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /applications/status-counts:
 *   get:
 *     summary: Get application counts grouped by status
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Counts by status
 */
router.get("/status-counts", asyncHandler(controller.getStatusCounts));

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Get all applications
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get("/", asyncHandler(controller.list));

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     summary: Get an application by ID
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application found
 *       404:
 *         description: Application not found
 */
router.get("/:id", asyncHandler(controller.getById));

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Create an application
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *     responses:
 *       201:
 *         description: Application created
 */
router.post("/", asyncHandler(controller.create));

/**
 * @swagger
 * /applications/quick:
 *   post:
 *     summary: Quick create an application with company and position names
 *     description: Creates company and position if they don't exist, then creates the application
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - position_title
 *               - status
 *             properties:
 *               company_name:
 *                 type: string
 *               position_title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [bookmarked, applied, phone_screen, technical, final_round, offer, rejected]
 *               date_applied:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application created
 */
router.post("/quick", asyncHandler(controller.quickCreate));

/**
 * @swagger
 * /applications/{id}:
 *   put:
 *     summary: Update an application
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *     responses:
 *       200:
 *         description: Application updated
 *       404:
 *         description: Application not found
 */
router.put("/:id", asyncHandler(controller.update));

/**
 * @swagger
 * /applications/{id}/status:
 *   patch:
 *     summary: Update application status only
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Application not found
 */
router.patch("/:id/status", asyncHandler(controller.updateStatus));

/**
 * @swagger
 * /applications/{id}:
 *   delete:
 *     summary: Delete an application
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Application deleted
 *       404:
 *         description: Application not found
 */
router.delete("/:id", asyncHandler(controller.delete));

export default router;
