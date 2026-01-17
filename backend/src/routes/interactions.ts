import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { interactions, contacts, applications, positions, companies } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { InteractionSchema, UpdateInteractionSchema } from "../schemas/interactions.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Interaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         application_id:
 *           type: integer
 *         contact_id:
 *           type: integer
 *         interaction_type:
 *           type: string
 *           enum: [email, call, interview, linkedin, other]
 *         interaction_date:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /interactions:
 *   get:
 *     summary: Get all interactions
 *     tags: [Interactions]
 *     parameters:
 *       - in: query
 *         name: application_id
 *         schema:
 *           type: integer
 *         description: Filter by application
 *     responses:
 *       200:
 *         description: List of interactions
 */
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const baseQuery = db
    .select({
      id: interactions.id,
      application_id: interactions.application_id,
      contact_id: interactions.contact_id,
      interaction_type: interactions.interaction_type,
      interaction_date: interactions.interaction_date,
      notes: interactions.notes,
      created_at: interactions.created_at,
      contact_name: contacts.name,
      position_title: positions.title,
      company_name: companies.name,
    })
    .from(interactions)
    .leftJoin(contacts, eq(interactions.contact_id, contacts.id))
    .innerJoin(applications, eq(interactions.application_id, applications.id))
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .orderBy(desc(interactions.interaction_date));

  const result = req.query.application_id
    ? await baseQuery.where(eq(interactions.application_id, Number(req.query.application_id)))
    : await baseQuery;

  res.json(result);
}));

/**
 * @swagger
 * /interactions/{id}:
 *   get:
 *     summary: Get an interaction by ID
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interaction found
 *       404:
 *         description: Interaction not found
 */
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .select({
      id: interactions.id,
      application_id: interactions.application_id,
      contact_id: interactions.contact_id,
      interaction_type: interactions.interaction_type,
      interaction_date: interactions.interaction_date,
      notes: interactions.notes,
      created_at: interactions.created_at,
      contact_name: contacts.name,
      position_title: positions.title,
      company_name: companies.name,
    })
    .from(interactions)
    .leftJoin(contacts, eq(interactions.contact_id, contacts.id))
    .innerJoin(applications, eq(interactions.application_id, applications.id))
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(eq(interactions.id, Number(req.params.id)));

  if (result.length === 0) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }
  res.json(result[0]);
}));

/**
 * @swagger
 * /interactions:
 *   post:
 *     summary: Create an interaction
 *     tags: [Interactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Interaction'
 *     responses:
 *       201:
 *         description: Interaction created
 */
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const data = InteractionSchema.parse(req.body);

  const result = await db
    .insert(interactions)
    .values({
      application_id: data.application_id,
      contact_id: data.contact_id,
      interaction_type: data.interaction_type,
      interaction_date: data.interaction_date,
      notes: data.notes,
    })
    .returning();

  res.status(201).json(result[0]);
}));

/**
 * @swagger
 * /interactions/{id}:
 *   put:
 *     summary: Update an interaction
 *     tags: [Interactions]
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
 *             $ref: '#/components/schemas/Interaction'
 *     responses:
 *       200:
 *         description: Interaction updated
 *       404:
 *         description: Interaction not found
 */
router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateInteractionSchema.parse(req.body);

  const result = await db
    .update(interactions)
    .set({
      application_id: data.application_id,
      contact_id: data.contact_id,
      interaction_type: data.interaction_type,
      interaction_date: data.interaction_date,
      notes: data.notes,
    })
    .where(eq(interactions.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }
  res.json(result[0]);
}));

/**
 * @swagger
 * /interactions/{id}:
 *   delete:
 *     summary: Delete an interaction
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Interaction deleted
 *       404:
 *         description: Interaction not found
 */
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .delete(interactions)
    .where(eq(interactions.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }
  res.status(204).send();
}));

export default router;
