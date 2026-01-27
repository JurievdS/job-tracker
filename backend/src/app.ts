import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import router from "./routes/index.js";
import authRouter from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticate } from "./middleware/auth.js";
import passport from "./config/passport.js";

const app = express();

// CORS configuration for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(passport.initialize());

// Public routes (no authentication required)
app.use("/auth", authRouter);

if (process.env.NODE_ENV !== "production") {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Protected routes (authentication required)
app.use("/", authenticate, router);

app.use(errorHandler);

export default app;
