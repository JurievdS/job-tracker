import { Router } from "express";
import { TagController } from "../controllers/TagController.js";
import { TagService } from "../services/TagService.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const tagService = new TagService();
const controller = new TagController(tagService);

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: List all tags
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags with application counts
 */
router.get("/", authenticate, controller.list);

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Get a tag by ID
 *     tags: [Tags]
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
 *         description: Tag details
 *       404:
 *         description: Tag not found
 */
router.get("/:id", authenticate, controller.getById);

/**
 * @swagger
 * /api/tags/{id}/applications:
 *   get:
 *     summary: Get applications with a specific tag
 *     tags: [Tags]
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
 *         description: List of applications
 */
router.get("/:id/applications", authenticate, controller.getApplications);

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       201:
 *         description: Created tag
 */
router.post("/", authenticate, controller.create);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Update a tag
 *     tags: [Tags]
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
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       200:
 *         description: Updated tag
 */
router.put("/:id", authenticate, controller.update);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete a tag
 *     tags: [Tags]
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
 *         description: Tag deleted
 */
router.delete("/:id", authenticate, controller.delete);

export default router;
