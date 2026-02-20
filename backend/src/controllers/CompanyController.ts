import { Request, Response } from "express";
import { CompanyService } from "../services/CompanyService.js";
import { CompanySchema, UpdateCompanySchema, UserCompanyNotesSchema } from "../schemas/companies.js";

/**
 * Company Controller
 */
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  /**
   * GET /companies
   * List all companies (optionally with user's notes)
   * Returns a list of companies, including user's notes
   */
  list = async (req: Request, res: Response) => {
    if (req.userId) {
      const companies = await this.companyService.findAllWithUserNotes(req.userId);
      res.json(companies);
    } else {
      const companies = await this.companyService.findAll();
      res.json(companies);
    }
  };

  /**
   * GET /companies/search?term=...
   * Search companies by name
   * Returns a list of matching companies
   */
  search = async (req: Request, res: Response) => {
    const term = (req.query.term as string) || "";
    const companies = await this.companyService.search(term);
    res.json(companies);
  };

  /**
   * GET /companies/:id
   * Get a single company by ID (with user's notes)
   * Returns the company with user's notes
   */
  getById = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);

    if (req.userId) {
      const company = await this.companyService.findByIdWithNotes(companyId, req.userId);
      res.json(company);
    } else {
      const company = await this.companyService.findByIdOrThrow(companyId);
      res.json(company);
    }
  };

  /**
   * POST /companies
   * Create a new company (global)
   * Returns the created company
   */
  create = async (req: Request, res: Response) => {
    const data = CompanySchema.parse(req.body);
    const company = await this.companyService.create(data);
    res.status(201).json(company);
  };

  /**
   * PUT /companies/:id
   * Update a company (global)
   * Returns the updated company
   */
  update = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    const data = UpdateCompanySchema.parse(req.body);
    const company = await this.companyService.update(companyId, data);
    res.json(company);
  };

  /**
   * DELETE /companies/:id
   * Delete a company (global)
   */
  delete = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    await this.companyService.delete(companyId);
    res.status(204).send();
  };

  // ==================== User Notes Endpoints ====================

  /**
   * GET /companies/:id/notes
   * Get user's personal notes for a company
   * Returns the user's notes and rating for the company
   */
  getUserNotes = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    const notes = await this.companyService.getUserNotes(req.userId!, companyId);
    res.json(notes || { notes: null, rating: null });
  };

  /**
   * PUT /companies/:id/notes
   * Set user's personal notes/rating for a company
   * Returns the updated notes and rating
   */
  setUserNotes = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    const data = UserCompanyNotesSchema.parse(req.body);
    const notes = await this.companyService.setUserNotes(req.userId!, companyId, data);
    res.json(notes);
  };

  /**
   * DELETE /companies/:id/notes
   * Delete user's personal notes for a company
   * Returns 204 No Content on success
   */
  deleteUserNotes = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    await this.companyService.deleteUserNotes(req.userId!, companyId);
    res.status(204).send();
  };
}
