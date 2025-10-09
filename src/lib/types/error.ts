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

export class WalletAddressValidationError extends AppError {
  constructor(address: string) {
    super(400, "WALLET_ADDRESS_INVALID", `Invalid wallet address format: ${address}`);
  }
}

export class UnsupportedChainError extends AppError {
  constructor(chainId: number) {
    super(400, "CHAIN_NOT_SUPPORTED", `Chain ID ${chainId} is not supported`);
  }
}

export class BlockchainApiError extends AppError {
  constructor(operation: string, originalError?: Error) {
    const message = `Blockchain API error during ${operation}${
      originalError ? `: ${originalError.message}` : ""
    }`;
    super(500, "BLOCKCHAIN_API_ERROR", message);
  }
}

export class TokenMetadataError extends AppError {
  constructor(tokenAddress: string, chainId: number) {
    super(
      500,
      "TOKEN_METADATA_ERROR",
      `Failed to fetch metadata for token ${tokenAddress} on chain ${chainId}`
    );
  }
}