import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod"; // Import ZodError

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorDetails = err;
  let errorSources: any[] = []; // Helpful for specific field errors

  // --- 1. Zod Validation Errors (NEW) ---
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => ({
      path: issue.path[issue.path.length - 1], // e.g., "minPrice"
      message: issue.message,
    }));
  }

  // --- 2. Prisma Validation Errors ---
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Prisma Validation Error: Incorrect field types or missing fields!";
  }

  // --- 3. Known Request Errors (Database Constraints) ---
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found.";
    } else if (err.code === "P2002") {
      statusCode = 400;
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      message = `Duplicate key error: This ${target} already exists.`;
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Foreign key constraint failed.";
    }
  }

  // Final Response
  res.status(statusCode).json({
    success: false,
    message,
    errorSources: errorSources.length > 0 ? errorSources : undefined, // Clean field errors
    errorDetails: process.env.NODE_ENV === "development" ? errorDetails : null,
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

export default globalErrorHandler;