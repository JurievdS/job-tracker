import { Router } from "express";
import applicationsRouter from "./applications.js";
import companyRouter from "./companies.js";
import contactsRouter from "./contacts.js";
import interactionsRouter from "./interactions.js";
import remindersRouter from "./reminders.js";
import profileRouter from "./profile.js";
import documentsRouter from "./documents.js";
import formTemplatesRouter from "./formTemplates.js";
import tagsRouter from "./tags.js";

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
router.use("/reminders", remindersRouter);
router.use("/profile", profileRouter);
router.use("/documents", documentsRouter);
router.use("/form-templates", formTemplatesRouter);
router.use("/tags", tagsRouter);

export default router;
