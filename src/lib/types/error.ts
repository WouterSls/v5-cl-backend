export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
  }
}

export class InternalError extends AppError {
  constructor(message: string = "Internal server error") {
    super(500, "INTERNAL_ERROR", message);
  }
}

export class TechnicalError extends AppError {
  constructor(message: string) {
    super(500, "TECHNICAL_ERROR", message);
  }
}

export class NotAuthorizedError extends AppError {
  constructor(message: string) {
    super(401, "NOT_AUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, "FORBIDDEN", message);
  }
}