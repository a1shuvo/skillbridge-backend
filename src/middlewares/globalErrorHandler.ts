import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorDetails = err;

  // --- 1. Prisma Validation Errors (Incorrect types/missing fields) ---
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message =
      "Prisma Validation Error: You provided incorrect field types or missing fields!";
  }

  // --- 2. Known Request Errors (Database Constraints) ---
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 404; // Changed to 404 as it's a "Not Found" error
      message =
        "Record not found: The operation failed because required records were missing.";
    } else if (err.code === "P2002") {
      statusCode = 400;
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      message = `Duplicate key error: A record with this ${target} already exists.`;
    } else if (err.code === "P2003") {
      statusCode = 400;
      message =
        "Foreign key constraint failed: You are trying to reference a record that does not exist.";
    }
  }

  // --- 3. Unknown Query Errors ---
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = "Prisma Unknown Error: An error occurred during query execution.";
  }

  // --- 4. Database Connection/Initialization Errors ---
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      message =
        "Database Authentication failed. Please check your credentials!";
    } else if (err.errorCode === "P1001") {
      statusCode = 503; // Service Unavailable
      message =
        "Database Unreachable: Cannot reach the database server. Check your connection.";
    } else {
      message = "Database Initialization failed.";
    }
  }

  // Final Response
  res.status(statusCode).json({
    success: false,
    message,
    errorDetails: process.env.NODE_ENV === "development" ? errorDetails : null,
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

export default globalErrorHandler;
