import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { applications, positions, companies } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { ApplicationSchema, UpdateApplicationSchema } from "../schemas/applications.js";

const router = Router();

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
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const baseQuery = db
    .select({
      id: applications.id,
      position_id: applications.position_id,
      status: applications.status,
      date_applied: applications.date_applied,
      notes: applications.notes,
      created_at: applications.created_at,
      updated_at: applications.updated_at,
      position_title: positions.title,
      company_name: companies.name,
    })
    .from(applications)
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .orderBy(desc(applications.updated_at));

  // Filter by status if provided
  const result = req.query.status
    ? await baseQuery.where(eq(applications.status, req.query.status as string))
    : await baseQuery;

  res.json(result);
}));

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
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .select({
      id: applications.id,
      position_id: applications.position_id,
      status: applications.status,
      date_applied: applications.date_applied,
      notes: applications.notes,
      created_at: applications.created_at,
      updated_at: applications.updated_at,
      position_title: positions.title,
      company_name: companies.name,
    })
    .from(applications)
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(eq(applications.id, Number(req.params.id)));

  if (result.length === 0) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(result[0]);
}));

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
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const data = ApplicationSchema.parse(req.body);

  const result = await db
    .insert(applications)
    .values({
      position_id: data.position_id,
      status: data.status,
      date_applied: data.date_applied,
      notes: data.notes,
    })
    .returning();

  res.status(201).json(result[0]);
}));

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
router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateApplicationSchema.parse(req.body);

  const result = await db
    .update(applications)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(applications.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(result[0]);
}));

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
router.patch("/:id/status", asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({
    status: ApplicationSchema.shape.status,
  }).parse(req.body);

  const result = await db
    .update(applications)
    .set({
      status,
      updated_at: new Date(),
    })
    .where(eq(applications.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(result[0]);
}));

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
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .delete(applications)
    .where(eq(applications.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.status(204).send();
}));

export default router;