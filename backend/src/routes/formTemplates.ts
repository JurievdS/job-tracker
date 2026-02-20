import { Router } from "express";
import { FormTemplateController } from "../controllers/FormTemplateController.js";
import { FormTemplateService } from "../services/FormTemplateService.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const formTemplateService = new FormTemplateService();
const controller = new FormTemplateController(formTemplateService);

/**
 * @swagger
 * /api/form-templates:
 *   get:
 *     summary: List all form templates
 *     tags: [Form Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of form templates
 */
router.get("/", authenticate, controller.list);

/**
 * @swagger
 * /api/form-templates/domain/{domain}:
 *   get:
 *     summary: Get a form template by domain
 *     tags: [Form Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form template
 *       404:
 *         description: Template not found
 */
router.get("/domain/:domain", authenticate, controller.getByDomain);

/**
 * @swagger
 * /api/form-templates/{id}:
 *   get:
 *     summary: Get a form template by ID
 *     tags: [Form Templates]
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
 *         description: Form template details
 *       404:
 *         description: Template not found
 */
router.get("/:id", authenticate, controller.getById);

/**
 * @swagger
 * /api/form-templates:
 *   post:
 *     summary: Create a new form template
 *     tags: [Form Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormTemplate'
 *     responses:
 *       201:
 *         description: Created form template
 */
router.post("/", authenticate, controller.create);

/**
 * @swagger
 * /api/form-templates/{id}:
 *   put:
 *     summary: Update a form template
 *     tags: [Form Templates]
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
 *             $ref: '#/components/schemas/FormTemplate'
 *     responses:
 *       200:
 *         description: Updated form template
 */
router.put("/:id", authenticate, controller.update);

/**
 * @swagger
 * /api/form-templates/{id}/usage:
 *   post:
 *     summary: Record template usage
 *     tags: [Form Templates]
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
 *         description: Usage recorded
 */
router.post("/:id/usage", authenticate, controller.recordUsage);

/**
 * @swagger
 * /api/form-templates/{id}/success-rate:
 *   patch:
 *     summary: Update template success rate
 *     tags: [Form Templates]
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
 *             required:
 *               - success_rate
 *             properties:
 *               success_rate:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       204:
 *         description: Success rate updated
 *       404:
 *         description: Template not found
 */
router.patch("/:id/success-rate", authenticate, controller.updateSuccessRate);

/**
 * @swagger
 * /api/form-templates/{id}:
 *   delete:
 *     summary: Delete a form template
 *     tags: [Form Templates]
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
 *         description: Template deleted
 */
router.delete("/:id", authenticate, controller.delete);

export default router;
