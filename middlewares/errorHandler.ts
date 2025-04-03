import { Request, Response, NextFunction } from "express";

// Define a custom error type if needed
class HttpError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Middleware to handle "Not Found" errors
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new HttpError(`Not Found: ${req.originalUrl}`, 404);
  next(error); // Pass the error to the error handler
};

// Error handling middleware
export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 if no specific status code is set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: err.stack,
  });
};
