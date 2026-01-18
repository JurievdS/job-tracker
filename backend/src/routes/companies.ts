import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { companies } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { CompanySchema, UpdateCompanySchema } from "../schemas/companies.js";

const router = Router();

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
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: List of companies
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await db.select().from(companies).where(eq(companies.user_id, req.userId!));
    res.json(result);
  }),
);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get a company by ID
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
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.user_id, req.userId!)));
    if (result.length === 0) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(result[0]);
  }),
);

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a company
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Company created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const data = CompanySchema.parse(req.body);

    const result = await db
      .insert(companies)
      .values({
        user_id: req.userId!,
        name: data.name,
        website: data.website,
        location: data.location,
        notes: data.notes,
        rating: data.rating,
      })
      .returning();
    res.status(201).json(result[0]);
  }),
);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update a company
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
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company updated
 *       404:
 *         description: Company not found
 */
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = UpdateCompanySchema.parse(req.body);

    const result = await db
      .update(companies)
      .set({
        name: data.name,
        website: data.website,
        location: data.location,
        notes: data.notes,
        rating: data.rating,
      })
      .where(and(eq(companies.id, id), eq(companies.user_id, req.userId!)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(result[0]);
  }),
);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete a company
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
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await db
      .delete(companies)
      .where(and(eq(companies.id, id), eq(companies.user_id, req.userId!)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.status(204).send();
  }),
);

export default router;
