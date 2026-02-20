import { db } from "../db/index.js";
import { contacts, companies } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import { CompanyService } from "./CompanyService.js";
import type { NewContact, UpdateContact } from "../schemas/contacts.js";

// Infer types from the schema
type Contact = typeof contacts.$inferSelect;

// Contact with company name included
export interface ContactWithCompany {
  id: number;
  company_id: number | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
  created_at: Date | null;
  company_name: string | null;
}

/**
 * Contact Service
 */
export class ContactService {
  constructor(private companyService: CompanyService = new CompanyService()) {}

  /**
   * Get all contacts for a user with optional company filter
   */
  async findAll(userId: number, companyId?: number): Promise<ContactWithCompany[]> {
    const baseQuery = db
      .select({
        id: contacts.id,
        company_id: contacts.company_id,
        name: contacts.name,
        role: contacts.role,
        email: contacts.email,
        phone: contacts.phone,
        linkedin: contacts.linkedin,
        notes: contacts.notes,
        created_at: contacts.created_at,
        company_name: companies.name,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .orderBy(desc(contacts.created_at));

    if (companyId) {
      return baseQuery.where(
        and(eq(contacts.company_id, companyId), eq(contacts.user_id, userId))
      );
    }

    return baseQuery.where(eq(contacts.user_id, userId));
  }

  /**
   * Get a contact by ID with company name
   */
  async findByIdWithDetails(
    contactId: number,
    userId: number
  ): Promise<ContactWithCompany> {
    const result = await db
      .select({
        id: contacts.id,
        company_id: contacts.company_id,
        name: contacts.name,
        role: contacts.role,
        email: contacts.email,
        phone: contacts.phone,
        linkedin: contacts.linkedin,
        notes: contacts.notes,
        created_at: contacts.created_at,
        company_name: companies.name,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(and(eq(contacts.id, contactId), eq(contacts.user_id, userId)));

    if (result.length === 0) {
      throw new NotFoundError("Contact not found");
    }

    return result[0];
  }

  /**
   * Get a contact by ID (basic, no joins)
   */
  async findByIdOrThrow(contactId: number, userId: number): Promise<Contact> {
    const result = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.user_id, userId)));

    if (result.length === 0) {
      throw new NotFoundError("Contact not found");
    }

    return result[0];
  }

  /**
   * Create a new contact
   */
  async create(userId: number, data: NewContact): Promise<Contact> {
    // Verify company exists if provided
    if (data.company_id) {
      await this.companyService.findByIdOrThrow(data.company_id);
    }

    const [contact] = await db
      .insert(contacts)
      .values({
        user_id: userId,
        company_id: data.company_id,
        name: data.name,
        role: data.role,
        email: data.email === "" ? null : data.email,
        phone: data.phone,
        linkedin: data.linkedin === "" ? null : data.linkedin,
        notes: data.notes,
      })
      .returning();

    return contact;
  }

  /**
   * Update a contact
   */
  async update(
    contactId: number,
    userId: number,
    data: UpdateContact
  ): Promise<Contact> {
    // Verify contact exists and belongs to user
    await this.findByIdOrThrow(contactId, userId);

    // If updating company_id, verify company exists (unless setting to null)
    if (data.company_id) {
      await this.companyService.findByIdOrThrow(data.company_id);
    }

    const [updated] = await db
      .update(contacts)
      .set({
        company_id: data.company_id === null ? null : data.company_id,
        name: data.name,
        role: data.role,
        email: data.email === "" ? null : data.email,
        phone: data.phone,
        linkedin: data.linkedin === "" ? null : data.linkedin,
        notes: data.notes,
      })
      .where(eq(contacts.id, contactId))
      .returning();

    return updated;
  }

  /**
   * Delete a contact
   */
  async delete(contactId: number, userId: number): Promise<void> {
    // Verify contact exists and belongs to user
    await this.findByIdOrThrow(contactId, userId);

    await db.delete(contacts).where(eq(contacts.id, contactId));
  }
}

export const contactService = new ContactService();
