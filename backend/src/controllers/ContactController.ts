import { Request, Response } from "express";
import { ContactService } from "../services/ContactService.js";
import { ContactSchema, UpdateContactSchema } from "../schemas/contacts.js";

/**
 * Contact Controller
 */
export class ContactController {
  constructor(private contactService: ContactService) {}

  /**
   * GET /contacts
   * List all contacts for the authenticated user
   * with optional company filter
   */
  list = async (req: Request, res: Response) => {
    const companyId = req.query.company_id
      ? Number(req.query.company_id)
      : undefined;
    const contacts = await this.contactService.findAll(req.userId!, companyId);
    res.json(contacts);
  };

  /**
   * GET /contacts/:id
   * Get a single contact by ID
   * Returns the contact with related details
   */
  getById = async (req: Request, res: Response) => {
    const contactId = Number(req.params.id);
    const contact = await this.contactService.findByIdWithDetails(
      contactId,
      req.userId!
    );
    res.json(contact);
  };

  /**
   * POST /contacts
   * Create a new contact
   * Returns the created contact
   */
  create = async (req: Request, res: Response) => {
    const data = ContactSchema.parse(req.body);
    const contact = await this.contactService.create(req.userId!, data);
    res.status(201).json(contact);
  };

  /**
   * PUT /contacts/:id
   * Update a contact
   * Returns the updated contact
   */
  update = async (req: Request, res: Response) => {
    const contactId = Number(req.params.id);
    const data = UpdateContactSchema.parse(req.body);
    const contact = await this.contactService.update(
      contactId,
      req.userId!,
      data
    );
    res.json(contact);
  };

  /**
   * DELETE /contacts/:id
   * Delete a contact
   * Returns 204 No Content on success
   */
  delete = async (req: Request, res: Response) => {
    const contactId = Number(req.params.id);
    await this.contactService.delete(contactId, req.userId!);
    res.status(204).send();
  };
}
