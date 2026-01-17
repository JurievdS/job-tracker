import { Router } from "express";
import applicationsRouter from "./applications.js";
import companyRouter from "./companies.js";
import contactsRouter from "./contacts.js";
import dashboardRouter from "./dashboard.js";
import interactionsRouter from "./interactions.js";
import positionsRouter from "./positions.js";
import remindersRouter from "./reminders.js";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API health check
 *     responses:
 *       200:
 *         description: API is running
 */
router.get("/", (req, res) => {
  res.json({ message: "Job Tracker API" });
});

router.use("/applications", applicationsRouter);
router.use("/companies", companyRouter);
router.use("/contacts", contactsRouter);
router.use("/interactions", interactionsRouter);
router.use("/positions", positionsRouter);
router.use("/reminders", remindersRouter);
router.use("/dashboard", dashboardRouter);

export default router;