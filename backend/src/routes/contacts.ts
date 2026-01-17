import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { contacts, companies } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { ContactSchema, UpdateContactSchema } from "../schemas/contacts.js";

const router = Router();

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
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const baseQuery = db
    .select({
      id: contacts.id,
      company_id: contacts.company_id,
      name: contacts.name,
      role: contacts.role,
      email: contacts.email,
      linkedin: contacts.linkedin,
      notes: contacts.notes,
      created_at: contacts.created_at,
      company_name: companies.name,
    })
    .from(contacts)
    .innerJoin(companies, eq(contacts.company_id, companies.id))
    .orderBy(desc(contacts.created_at));

  const result = req.query.company_id
    ? await baseQuery.where(eq(contacts.company_id, Number(req.query.company_id)))
    : await baseQuery;

  res.json(result);
}));

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
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .select({
      id: contacts.id,
      company_id: contacts.company_id,
      name: contacts.name,
      role: contacts.role,
      email: contacts.email,
      linkedin: contacts.linkedin,
      notes: contacts.notes,
      created_at: contacts.created_at,
      company_name: companies.name,
    })
    .from(contacts)
    .innerJoin(companies, eq(contacts.company_id, companies.id))
    .where(eq(contacts.id, Number(req.params.id)));

  if (result.length === 0) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(result[0]);
}));

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
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const data = ContactSchema.parse(req.body);

  const result = await db
    .insert(contacts)
    .values({
      company_id: data.company_id,
      name: data.name,
      role: data.role,
      email: data.email,
      linkedin: data.linkedin,
      notes: data.notes,
    })
    .returning();

  res.status(201).json(result[0]);
}));

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
router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateContactSchema.parse(req.body);

  const result = await db
    .update(contacts)
    .set({
      company_id: data.company_id,
      name: data.name,
      role: data.role,
      email: data.email,
      linkedin: data.linkedin,
      notes: data.notes,
    })
    .where(eq(contacts.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(result[0]);
}));

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
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const result = await db
    .delete(contacts)
    .where(eq(contacts.id, Number(req.params.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.status(204).send();
}));

export default router;
