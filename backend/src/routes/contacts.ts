import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { ContactController } from "../controllers/ContactController.js";
import { ContactService } from "../services/ContactService.js";

const router = Router();

// Initialize controller with service
const contactService = new ContactService();
const controller = new ContactController(contactService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         company_id:
 *           type: integer
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         email:
 *           type: string
 *         linkedin:
 *           type: string
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts
 *     tags: [Contacts]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: integer
 *         description: Filter by company
 *     responses:
 *       200:
 *         description: List of contacts
 */
router.get("/", authenticate, asyncHandler(controller.list));

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get a contact by ID
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact found
 *       404:
 *         description: Contact not found
 */
router.get("/:id", authenticate, asyncHandler(controller.getById));

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a contact
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       201:
 *         description: Contact created
 */
router.post("/", authenticate, asyncHandler(controller.create));

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Update a contact
 *     tags: [Contacts]
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
 *             $ref: '#/components/schemas/Contact'
 *     responses:
 *       200:
 *         description: Contact updated
 *       404:
 *         description: Contact not found
 */
router.put("/:id", authenticate, asyncHandler(controller.update));

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Contact deleted
 *       404:
 *         description: Contact not found
 */
router.delete("/:id", authenticate, asyncHandler(controller.delete));

export default router;
