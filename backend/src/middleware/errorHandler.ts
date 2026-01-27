import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../errors/index.js";

type asyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Handle application-specific errors
  if (err instanceof AppError) {
    const response: { error: string; errors?: Record<string, string[]> } = {
      error: err.message,
    };

    // Include validation errors if present
    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues,
    });
    return;
  }

  // Log unexpected errors
  console.error(err.message, err.stack);

  // Send generic error response for unexpected errors
  if (process.env.NODE_ENV !== "production") {
    res.status(500).json({ error: err.message, stack: err.stack });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

function asyncHandler(fn: asyncRequestHandler): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { errorHandler, asyncHandler };
