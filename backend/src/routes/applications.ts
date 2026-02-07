import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
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
 *         company_id:
 *           type: integer
 *         job_title:
 *           type: string
 *         job_url:
 *           type: string
 *         job_description:
 *           type: string
 *         requirements:
 *           type: string
 *         location:
 *           type: string
 *         remote_type:
 *           type: string
 *           enum: [onsite, hybrid, remote]
 *         salary_advertised_min:
 *           type: integer
 *         salary_advertised_max:
 *           type: integer
 *         salary_offered:
 *           type: integer
 *         salary_currency:
 *           type: string
 *         salary_period:
 *           type: string
 *           enum: [hourly, monthly, annual]
 *         status:
 *           type: string
 *           enum: [bookmarked, applied, phone_screen, technical, final_round, offer, rejected, withdrawn, ghosted]
 *         source:
 *           type: string
 *         source_url:
 *           type: string
 *         date_applied:
 *           type: string
 *           format: date
 *         date_responded:
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
router.get("/status-counts", authenticate, asyncHandler(controller.getStatusCounts));

/**
 * @swagger
 * /applications/source-metrics:
 *   get:
 *     summary: Get application metrics grouped by source
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Metrics by source
 */
router.get("/source-metrics", authenticate, asyncHandler(controller.getSourceMetrics));

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
router.get("/", authenticate, asyncHandler(controller.list));

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
router.get("/:id", authenticate, asyncHandler(controller.getById));

/**
 * @swagger
 * /applications/{id}/status-history:
 *   get:
 *     summary: Get status history for an application
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status history
 */
router.get("/:id/status-history", authenticate, asyncHandler(controller.getStatusHistory));

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
router.post("/", authenticate, asyncHandler(controller.create));

/**
 * @swagger
 * /applications/quick:
 *   post:
 *     summary: Quick create an application with company name
 *     description: Creates company if it doesn't exist, then creates the application
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - job_title
 *               - source
 *             properties:
 *               company_name:
 *                 type: string
 *               job_title:
 *                 type: string
 *               source:
 *                 type: string
 *               status:
 *                 type: string
 *               job_url:
 *                 type: string
 *               date_applied:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application created
 */
router.post("/quick", authenticate, asyncHandler(controller.quickCreate));

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
router.put("/:id", authenticate, asyncHandler(controller.update));

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
router.patch("/:id/status", authenticate, asyncHandler(controller.updateStatus));

/**
 * @swagger
 * /applications/{id}/tags:
 *   post:
 *     summary: Add tags to an application
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
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       204:
 *         description: Tags added
 */
router.post("/:id/tags", authenticate, asyncHandler(controller.addTags));

/**
 * @swagger
 * /applications/{id}/tags:
 *   put:
 *     summary: Set tags for an application (replace all)
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
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       204:
 *         description: Tags set
 */
router.put("/:id/tags", authenticate, asyncHandler(controller.setTags));

/**
 * @swagger
 * /applications/{id}/tags:
 *   delete:
 *     summary: Remove tags from an application
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
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       204:
 *         description: Tags removed
 */
router.delete("/:id/tags", authenticate, asyncHandler(controller.removeTags));

/**
 * @swagger
 * /applications/{id}/documents:
 *   get:
 *     summary: Get documents attached to an application
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of attached documents
 */
router.get("/:id/documents", authenticate, asyncHandler(controller.getDocuments));

/**
 * @swagger
 * /applications/{id}/documents:
 *   post:
 *     summary: Attach documents to an application
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
 *             required:
 *               - document_ids
 *             properties:
 *               document_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               doc_role:
 *                 type: string
 *                 description: Role of documents (e.g., cv_submitted, cover_letter)
 *     responses:
 *       204:
 *         description: Documents attached
 */
router.post("/:id/documents", authenticate, asyncHandler(controller.addDocuments));

/**
 * @swagger
 * /applications/{id}/documents:
 *   put:
 *     summary: Set documents for an application (replace all)
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
 *             required:
 *               - document_ids
 *             properties:
 *               document_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               doc_role:
 *                 type: string
 *     responses:
 *       204:
 *         description: Documents set
 */
router.put("/:id/documents", authenticate, asyncHandler(controller.setDocuments));

/**
 * @swagger
 * /applications/{id}/documents/{docId}:
 *   delete:
 *     summary: Remove a document from an application
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Document removed
 */
router.delete("/:id/documents/:docId", authenticate, asyncHandler(controller.removeDocument));

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
router.delete("/:id", authenticate, asyncHandler(controller.delete));

export default router;
