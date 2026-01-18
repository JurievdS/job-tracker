import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { interactions, contacts, applications, positions, companies } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
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
    ? await baseQuery.where(and(eq(interactions.application_id, Number(req.query.application_id)), eq(companies.user_id, req.userId!)))
    : await baseQuery.where(eq(companies.user_id, req.userId!));

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
    .where(and(eq(interactions.id, Number(req.params.id)), eq(companies.user_id, req.userId!)));

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

  // Verify application belongs to user via position -> company
  const application = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(and(eq(applications.id, data.application_id), eq(companies.user_id, req.userId!)));

  if (application.length === 0) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  // If contact_id provided, verify contact belongs to user via company
  if (data.contact_id) {
    const contact = await db
      .select({ id: contacts.id })
      .from(contacts)
      .innerJoin(companies, eq(contacts.company_id, companies.id))
      .where(and(eq(contacts.id, data.contact_id), eq(companies.user_id, req.userId!)));

    if (contact.length === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
  }

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
  const interactionId = Number(req.params.id);

  // Verify interaction belongs to user via application -> position -> company
  const existingInteraction = await db
    .select({ id: interactions.id })
    .from(interactions)
    .innerJoin(applications, eq(interactions.application_id, applications.id))
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(and(eq(interactions.id, interactionId), eq(companies.user_id, req.userId!)));

  if (existingInteraction.length === 0) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  // If updating application_id, verify new application belongs to user
  if (data.application_id) {
    const application = await db
      .select({ id: applications.id })
      .from(applications)
      .innerJoin(positions, eq(applications.position_id, positions.id))
      .innerJoin(companies, eq(positions.company_id, companies.id))
      .where(and(eq(applications.id, data.application_id), eq(companies.user_id, req.userId!)));

    if (application.length === 0) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
  }

  // If updating contact_id, verify new contact belongs to user
  if (data.contact_id) {
    const contact = await db
      .select({ id: contacts.id })
      .from(contacts)
      .innerJoin(companies, eq(contacts.company_id, companies.id))
      .where(and(eq(contacts.id, data.contact_id), eq(companies.user_id, req.userId!)));

    if (contact.length === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
  }

  const result = await db
    .update(interactions)
    .set({
      application_id: data.application_id,
      contact_id: data.contact_id,
      interaction_type: data.interaction_type,
      interaction_date: data.interaction_date,
      notes: data.notes,
    })
    .where(eq(interactions.id, interactionId))
    .returning();

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
  const interactionId = Number(req.params.id);

  // Verify interaction belongs to user via application -> position -> company
  const existingInteraction = await db
    .select({ id: interactions.id })
    .from(interactions)
    .innerJoin(applications, eq(interactions.application_id, applications.id))
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(and(eq(interactions.id, interactionId), eq(companies.user_id, req.userId!)));

  if (existingInteraction.length === 0) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  await db.delete(interactions).where(eq(interactions.id, interactionId));
  res.status(204).send();
}));

export default router;
