import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { positions, companies } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { PositionSchema, UpdatePositionSchema } from "../schemas/positions.js";

const router = Router();

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
 *     responses:
 *       200:
 *         description: List of positions
 */
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .select({
      id: positions.id,
      company_id: positions.company_id,
      title: positions.title,
      salary_min: positions.salary_min,
      salary_max: positions.salary_max,
      requirements: positions.requirements,
      job_url: positions.job_url,
      created_at: positions.created_at,
      company_name: companies.name,
    })
    .from(positions)
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(eq(companies.user_id, req.userId!))
    .orderBy(desc(positions.created_at));

  res.json(result);
}));

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
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .select({
      id: positions.id,
      company_id: positions.company_id,
      title: positions.title,
      salary_min: positions.salary_min,
      salary_max: positions.salary_max,
      requirements: positions.requirements,
      job_url: positions.job_url,
      created_at: positions.created_at,
      company_name: companies.name,
    })
    .from(positions)
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(and(eq(positions.id, Number(req.params.id)), eq(companies.user_id, req.userId!)));

  if (result.length === 0) {
    res.status(404).json({ error: "Position not found" });
    return;
  }
  res.json(result[0]);
}));

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
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const data = PositionSchema.parse(req.body);

  // Verify company belongs to user
  const company = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, data.company_id), eq(companies.user_id, req.userId!)));

  if (company.length === 0) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const result = await db
    .insert(positions)
    .values({
      company_id: data.company_id,
      title: data.title,
      salary_min: data.salary_min,
      salary_max: data.salary_max,
      requirements: data.requirements,
      job_url: data.job_url,
    })
    .returning();

  res.status(201).json(result[0]);
}));

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
router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const data = UpdatePositionSchema.parse(req.body);
  const positionId = Number(req.params.id);

  // Verify position belongs to user via company
  const existingPosition = await db
    .select({ id: positions.id })
    .from(positions)
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(and(eq(positions.id, positionId), eq(companies.user_id, req.userId!)));

  if (existingPosition.length === 0) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  // If updating company_id, verify new company belongs to user
  if (data.company_id) {
    const company = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, data.company_id), eq(companies.user_id, req.userId!)));

    if (company.length === 0) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
  }

  const result = await db
    .update(positions)
    .set({
      company_id: data.company_id,
      title: data.title,
      salary_min: data.salary_min,
      salary_max: data.salary_max,
      requirements: data.requirements,
      job_url: data.job_url,
    })
    .where(eq(positions.id, positionId))
    .returning();

  res.json(result[0]);
}));

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
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const positionId = Number(req.params.id);

  // Verify position belongs to user via company
  const existingPosition = await db
    .select({ id: positions.id })
    .from(positions)
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(and(eq(positions.id, positionId), eq(companies.user_id, req.userId!)));

  if (existingPosition.length === 0) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  await db.delete(positions).where(eq(positions.id, positionId));
  res.status(204).send();
}));

export default router;
