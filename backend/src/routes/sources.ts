import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { SourceController } from "../controllers/SourceController.js";
import { SourceService } from "../services/SourceService.js";

const router = Router();

// Initialize controller with service
const sourceService = new SourceService();
const controller = new SourceController(sourceService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Source:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         normalized_name:
 *           type: string
 *         url:
 *           type: string
 *           nullable: true
 *         logo_url:
 *           type: string
 *           nullable: true
 *         category:
 *           type: string
 *           enum: [job_board, aggregator, company_site, government, recruiter, referral, community, other]
 *           nullable: true
 *         region:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         is_active:
 *           type: boolean
 *         usage_count:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /sources:
 *   get:
 *     summary: Get all active sources
 *     description: Returns all active sources, ordered by popularity (usage count)
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sources
 */
router.get("/", authenticate, asyncHandler(controller.list));

/**
 * @swagger
 * /sources/search:
 *   get:
 *     summary: Search sources by name
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of matching sources
 */
router.get("/search", authenticate, asyncHandler(controller.search));

/**
 * @swagger
 * /sources/find-or-create:
 *   post:
 *     summary: Find or create a source by name
 *     description: Returns existing source if name matches, otherwise creates a new one
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Source found or created
 */
router.post("/find-or-create", authenticate, asyncHandler(controller.findOrCreate));

/**
 * @swagger
 * /sources/{id}:
 *   get:
 *     summary: Get a source by ID
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Source found
 *       404:
 *         description: Source not found
 */
router.get("/:id", authenticate, asyncHandler(controller.getById));

/**
 * @swagger
 * /sources:
 *   post:
 *     summary: Create a source
 *     description: Creates a new global source. Sources are shared across all users.
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [job_board, aggregator, company_site, government, recruiter, referral, community, other]
 *               region:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Source created
 *       409:
 *         description: Similar source already exists
 */
router.post("/", authenticate, asyncHandler(controller.create));

/**
 * @swagger
 * /sources/{id}:
 *   put:
 *     summary: Update a source
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               category:
 *                 type: string
 *               region:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Source updated
 *       404:
 *         description: Source not found
 */
router.put("/:id", authenticate, asyncHandler(controller.update));

/**
 * @swagger
 * /sources/{id}:
 *   delete:
 *     summary: Delete a source (soft delete)
 *     description: Sets is_active to false. Source will no longer appear in lists.
 *     tags: [Sources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Source deleted
 *       404:
 *         description: Source not found
 */
router.delete("/:id", authenticate, asyncHandler(controller.delete));

// User notes on sources
router.get("/:id/notes", authenticate, asyncHandler(controller.getUserNotes));
router.put("/:id/notes", authenticate, asyncHandler(controller.setUserNotes));
router.delete("/:id/notes", authenticate, asyncHandler(controller.deleteUserNotes));

export default router;
