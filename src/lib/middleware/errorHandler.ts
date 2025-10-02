import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error";
import { ErrorResponse } from "../../resources/generated/types";

const sendErrorResponse = (res: Response, statusCode: number, code: string, message: string): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  res.status(statusCode).json(errorResponse);
};

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Error occurred:", error.message);

  if (process.env.NODE_ENV === "development") {
    console.error("Stack trace:", error.stack);
  }

  if (error instanceof AppError) {
    sendErrorResponse(res, error.statusCode, error.code, error.message);
    return;
  }

  sendErrorResponse(res, 500, "INTERNAL_ERROR", "Internal server error");
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};