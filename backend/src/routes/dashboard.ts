import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { applications, companies, reminders, positions } from "../db/schema.js";
import { eq, and, lte, count, desc, sql } from "drizzle-orm";


const router = Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get application statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const statusCounts = await db
    .select({
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(eq(companies.user_id, req.userId!))
    .groupBy(applications.status);

  const totalCompanies = await db
    .select({ count: count() })
    .from(companies)
    .where(eq(companies.user_id, req.userId!));

  const totalApplications = await db
    .select({ count: count() })
    .from(applications)
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(eq(companies.user_id, req.userId!));

  const pendingReminders = await db
    .select({ count: count() })
    .from(reminders)
    .innerJoin(applications, eq(reminders.application_id, applications.id))
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(
      and(
        eq(reminders.completed, false),
        lte(reminders.reminder_date, sql`CURRENT_DATE`),
        eq(companies.user_id, req.userId!)
      )
    );

  const recentActivity = await db
    .select({
      id: applications.id,
      status: applications.status,
      updated_at: applications.updated_at,
      position_title: positions.title,
      company_name: companies.name,
    })
    .from(applications)
    .innerJoin(positions, eq(applications.position_id, positions.id))
    .innerJoin(companies, eq(positions.company_id, companies.id))
    .where(eq(companies.user_id, req.userId!))
    .orderBy(desc(applications.updated_at))
    .limit(5);

  res.json({
    stats: {
      total_companies: totalCompanies[0].count,
      total_applications: totalApplications[0].count,
      pending_reminders: pendingReminders[0].count,
      by_status: statusCounts,
    },
    recent_activity: recentActivity,
  });
}));

export default router;
