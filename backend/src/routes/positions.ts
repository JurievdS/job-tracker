import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { PositionController } from "../controllers/PositionController.js";
import { PositionService } from "../services/PositionService.js";

const router = Router();

// Initialize controller with service
const positionService = new PositionService();
const controller = new PositionController(positionService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Position:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         company_id:
 *           type: integer
 *         title:
 *           type: string
 *         salary_min:
 *           type: integer
 *         salary_max:
 *           type: integer
 *         requirements:
 *           type: string
 *         job_url:
 *           type: string
 */

/**
 * @swagger
 * /positions:
 *   get:
 *     summary: Get all positions
 *     tags: [Positions]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: integer
 *         description: Filter by company
 *     responses:
 *       200:
 *         description: List of positions
 */
router.get("/", asyncHandler(controller.list));

/**
 * @swagger
 * /positions/{id}:
 *   get:
 *     summary: Get a position by ID
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Position found
 *       404:
 *         description: Position not found
 */
router.get("/:id", asyncHandler(controller.getById));

/**
 * @swagger
 * /positions:
 *   post:
 *     summary: Create a position
 *     tags: [Positions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Position'
 *     responses:
 *       201:
 *         description: Position created
 */
router.post("/", asyncHandler(controller.create));

/**
 * @swagger
 * /positions/{id}:
 *   put:
 *     summary: Update a position
 *     tags: [Positions]
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
 *             $ref: '#/components/schemas/Position'
 *     responses:
 *       200:
 *         description: Position updated
 *       404:
 *         description: Position not found
 */
router.put("/:id", asyncHandler(controller.update));

/**
 * @swagger
 * /positions/{id}:
 *   delete:
 *     summary: Delete a position
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Position deleted
 *       404:
 *         description: Position not found
 */
router.delete("/:id", asyncHandler(controller.delete));

export default router;
