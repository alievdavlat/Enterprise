import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error & { status?: number; details?: unknown },
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error("[Enterprise Error]", err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const name = getErrorName(status);

  res.status(status).json({
    error: {
      status,
      name,
      message,
      details: err.details || {},
    },
  });
}

function getErrorName(status: number): string {
  const names: Record<number, string> = {
    400: "BadRequest",
    401: "Unauthorized",
    403: "Forbidden",
    404: "NotFound",
    409: "Conflict",
    422: "UnprocessableEntity",
    429: "TooManyRequests",
    500: "InternalServerError",
  };
  return names[status] || "Error";
}
