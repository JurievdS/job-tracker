import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { InteractionController } from "../controllers/InteractionController.js";
import { InteractionService } from "../services/InteractionService.js";

const router = Router();

// Initialize controller with service
const interactionService = new InteractionService();
const controller = new InteractionController(interactionService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Interaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         application_id:
 *           type: integer
 *         contact_id:
 *           type: integer
 *         interaction_type:
 *           type: string
 *           enum: [email, call, interview, linkedin, other]
 *         interaction_date:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /interactions:
 *   get:
 *     summary: Get all interactions
 *     tags: [Interactions]
 *     parameters:
 *       - in: query
 *         name: application_id
 *         schema:
 *           type: integer
 *         description: Filter by application
 *     responses:
 *       200:
 *         description: List of interactions
 */
router.get("/", asyncHandler(controller.list));

/**
 * @swagger
 * /interactions/{id}:
 *   get:
 *     summary: Get an interaction by ID
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interaction found
 *       404:
 *         description: Interaction not found
 */
router.get("/:id", asyncHandler(controller.getById));

/**
 * @swagger
 * /interactions:
 *   post:
 *     summary: Create an interaction
 *     tags: [Interactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Interaction'
 *     responses:
 *       201:
 *         description: Interaction created
 */
router.post("/", asyncHandler(controller.create));

/**
 * @swagger
 * /interactions/{id}:
 *   put:
 *     summary: Update an interaction
 *     tags: [Interactions]
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
 *             $ref: '#/components/schemas/Interaction'
 *     responses:
 *       200:
 *         description: Interaction updated
 *       404:
 *         description: Interaction not found
 */
router.put("/:id", asyncHandler(controller.update));

/**
 * @swagger
 * /interactions/{id}:
 *   delete:
 *     summary: Delete an interaction
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Interaction deleted
 *       404:
 *         description: Interaction not found
 */
router.delete("/:id", asyncHandler(controller.delete));

export default router;
