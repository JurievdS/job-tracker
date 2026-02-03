import { apiClient } from "./client";
import type {
  Position,
  PositionWithCompany,
  CreatePositionDto,
  UpdatePositionDto,
} from "@/types/position";

/**
 * Positions API Service
 *
 * Positions are GLOBAL reference data - shared across all users.
 * Each position is associated with a company.
 */
export const positionsApi = {
  /**
   * List all positions with optional company filter
   * GET /positions
   */
  list: async (companyId?: number): Promise<PositionWithCompany[]> => {
    const response = await apiClient.get<PositionWithCompany[]>("/positions", {
      params: companyId ? { company_id: companyId } : undefined,
    });
    return response.data;
  },

  /**
   * Get a single position by ID
   * GET /positions/:id
   */
  get: async (id: number): Promise<PositionWithCompany> => {
    const response = await apiClient.get<PositionWithCompany>(
      `/positions/${id}`
    );
    return response.data;
  },

  /**
   * Create a new position
   * POST /positions
   */
  create: async (data: CreatePositionDto): Promise<Position> => {
    const response = await apiClient.post<Position>("/positions", data);
    return response.data;
  },

  /**
   * Update a position
   * PUT /positions/:id
   */
  update: async (id: number, data: UpdatePositionDto): Promise<Position> => {
    const response = await apiClient.put<Position>(`/positions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a position
   * DELETE /positions/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/positions/${id}`);
  },
};
