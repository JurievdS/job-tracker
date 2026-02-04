import { apiClient } from "./client";
import type {
  Interaction,
  InteractionWithDetails,
  CreateInteractionDto,
  UpdateInteractionDto,
} from "@/types/interaction";

/**
 * Interactions API Service
 *
 * Interactions track communication with contacts for job applications.
 */
export const interactionsApi = {
  /**
   * List all interactions with optional application filter
   * GET /interactions
   */
  list: async (applicationId?: number): Promise<InteractionWithDetails[]> => {
    const response = await apiClient.get<InteractionWithDetails[]>(
      "/interactions",
      {
        params: applicationId ? { application_id: applicationId } : undefined,
      }
    );
    return response.data;
  },

  /**
   * Get a single interaction by ID
   * GET /interactions/:id
   */
  get: async (id: number): Promise<InteractionWithDetails> => {
    const response = await apiClient.get<InteractionWithDetails>(
      `/interactions/${id}`
    );
    return response.data;
  },

  /**
   * Create a new interaction
   * POST /interactions
   */
  create: async (data: CreateInteractionDto): Promise<Interaction> => {
    const response = await apiClient.post<Interaction>("/interactions", data);
    return response.data;
  },

  /**
   * Update an interaction
   * PUT /interactions/:id
   */
  update: async (
    id: number,
    data: UpdateInteractionDto
  ): Promise<Interaction> => {
    const response = await apiClient.put<Interaction>(
      `/interactions/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete an interaction
   * DELETE /interactions/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/interactions/${id}`);
  },
};
