import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController.js";
import { DocumentService } from "../services/DocumentService.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const documentService = new DocumentService();
const controller = new DocumentController(documentService);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List all documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get("/", authenticate, controller.list);

/**
 * @swagger
 * /api/documents/defaults:
 *   get:
 *     summary: Get default documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of default documents
 */
router.get("/defaults", authenticate, controller.getDefaults);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     tags: [Documents]
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
 *         description: Document details
 *       404:
 *         description: Document not found
 */
router.get("/:id", authenticate, controller.getById);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Document'
 *     responses:
 *       201:
 *         description: Created document
 */
router.post("/", authenticate, controller.create);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [Documents]
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
 *             $ref: '#/components/schemas/Document'
 *     responses:
 *       200:
 *         description: Updated document
 */
router.put("/:id", authenticate, controller.update);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
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
 *         description: Document deleted
 */
router.delete("/:id", authenticate, controller.delete);

export default router;
