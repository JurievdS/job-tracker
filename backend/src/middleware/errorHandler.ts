import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";

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
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues,
    });
    return;
  }

  // log the error to console
  console.error(err.message, err.stack);

  // send generic error response
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
