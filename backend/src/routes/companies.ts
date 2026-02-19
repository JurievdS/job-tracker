import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { CompanyController } from "../controllers/CompanyController.js";
import { CompanyService } from "../services/CompanyService.js";

const router = Router();

// Initialize controller with service
const companyService = new CompanyService();
const controller = new CompanyController(companyService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         website:
 *           type: string
 *         location:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     CompanyWithNotes:
 *       allOf:
 *         - $ref: '#/components/schemas/Company'
 *         - type: object
 *           properties:
 *             user_notes:
 *               type: string
 *               nullable: true
 *             user_rating:
 *               type: integer
 *               minimum: 1
 *               maximum: 5
 *               nullable: true
 *     UserCompanyNotes:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies
 *     description: Returns all companies. If authenticated, includes user's personal notes.
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: List of companies
 */
router.get("/", authenticate, asyncHandler(controller.list));

/**
 * @swagger
 * /companies/search:
 *   get:
 *     summary: Search companies by name
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of matching companies
 */
router.get("/search", authenticate, asyncHandler(controller.search));

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get a company by ID
 *     description: Returns a company. If authenticated, includes user's personal notes.
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Company found
 *       404:
 *         description: Company not found
 */
router.get("/:id", authenticate, asyncHandler(controller.getById));

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a company
 *     description: Creates a new global company. Companies are shared across all users.
 *     tags: [Companies]
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
 *               website:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Company created
 */
router.post("/", authenticate, asyncHandler(controller.create));

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update a company
 *     description: Updates a global company. Changes affect all users.
 *     tags: [Companies]
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
 *               website:
 *                 type: string
 *               location:
 *                 type: string
 *               industry:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company updated
 *       404:
 *         description: Company not found
 *       409:
 *         description: Company name conflict
 */
router.put("/:id", authenticate, asyncHandler(controller.update));

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete a company
 *     description: Deletes a global company. Linked applications and contacts will have their company reference set to null.
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Company deleted
 *       404:
 *         description: Company not found
 */
router.delete("/:id", authenticate, asyncHandler(controller.delete));

/**
 * @swagger
 * /companies/{id}/notes:
 *   get:
 *     summary: Get user's notes for a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's notes for the company
 */
router.get("/:id/notes", authenticate, asyncHandler(controller.getUserNotes));

/**
 * @swagger
 * /companies/{id}/notes:
 *   put:
 *     summary: Set user's notes for a company
 *     tags: [Companies]
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
 *             $ref: '#/components/schemas/UserCompanyNotes'
 *     responses:
 *       200:
 *         description: Notes updated
 *       404:
 *         description: Company not found
 */
router.put("/:id/notes", authenticate, asyncHandler(controller.setUserNotes));

/**
 * @swagger
 * /companies/{id}/notes:
 *   delete:
 *     summary: Delete user's notes for a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Notes deleted
 */
router.delete("/:id/notes", authenticate, asyncHandler(controller.deleteUserNotes));

export default router;
