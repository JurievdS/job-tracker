import { db } from "../db/index.js";
import { userProfiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import type { NewUserProfile, UpdateUserProfile } from "../schemas/userProfiles.js";

type UserProfile = typeof userProfiles.$inferSelect;

/**
 * User Profile Service
 */
export class UserProfileService {
  /**
   * Get user profile by user ID
   */
  async findByUserId(userId: number): Promise<UserProfile | null> {
    const result = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.user_id, userId));

    return result[0] || null;
  }

  /**
   * Get user profile by user ID or throw
   */
  async findByUserIdOrThrow(userId: number): Promise<UserProfile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("User profile not found");
    }
    return profile;
  }

  /**
   * Create or update user profile (upsert)
   */
  async upsert(userId: number, data: NewUserProfile): Promise<UserProfile> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      return this.update(userId, data);
    }

    const [profile] = await db
      .insert(userProfiles)
      .values({
        user_id: userId,
        full_name: data.full_name,
        phone: data.phone,
        location: data.location,
        nationality: data.nationality,
        linkedin_url: data.linkedin_url === "" ? null : data.linkedin_url,
        github_url: data.github_url === "" ? null : data.github_url,
        portfolio_url: data.portfolio_url === "" ? null : data.portfolio_url,
        summary: data.summary,
        work_history: data.work_history,
        education: data.education,
        skills: data.skills,
        languages: data.languages,
        base_currency: data.base_currency,
        salary_expectation_min: data.salary_expectation_min,
        salary_expectation_max: data.salary_expectation_max,
      })
      .returning();

    return profile;
  }

  /**
   * Update user profile
   */
  async update(userId: number, data: UpdateUserProfile): Promise<UserProfile> {
    await this.findByUserIdOrThrow(userId);

    const [updated] = await db
      .update(userProfiles)
      .set({
        ...data,
        linkedin_url: data.linkedin_url === "" ? null : data.linkedin_url,
        github_url: data.github_url === "" ? null : data.github_url,
        portfolio_url: data.portfolio_url === "" ? null : data.portfolio_url,
        updated_at: new Date(),
      })
      .where(eq(userProfiles.user_id, userId))
      .returning();

    return updated;
  }

  /**
   * Delete user profile
   */
  async delete(userId: number): Promise<void> {
    await db.delete(userProfiles).where(eq(userProfiles.user_id, userId));
  }
}

export const userProfileService = new UserProfileService();
