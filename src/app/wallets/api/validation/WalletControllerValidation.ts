import { ValidationError } from "../../../../lib/types/error";

export const validateWalletAddress = (address: string | undefined): string => {
  if (!address || typeof address !== "string") {
    throw new ValidationError("Missing or invalid required parameter: address must be a string");
  }

  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressPattern.test(address)) {
    throw new ValidationError(
      "Invalid address format: must be a valid Ethereum address (0x followed by 40 hex characters)"
    );
  }

  return address;
};

export const validateChainId = (chainId: string | undefined): number => {
  if (!chainId || typeof chainId !== "string") {
    throw new ValidationError("Missing or invalid required parameter: chainId must be provided");
  }

  const chainIdNum = parseInt(chainId, 10);

  if (isNaN(chainIdNum)) {
    throw new ValidationError("Invalid chainId: must be a valid number");
  }

  const ETH = 1
  const BASE = 8453
  const ARB = 42161
  const OP = 10
  const POLYGON = 137
  const supportedChainIds = [ETH, BASE];

  if (!supportedChainIds.includes(chainIdNum)) {
    throw new ValidationError(
      `Unsupported chainId: ${chainIdNum}. Supported chains: 1 (Ethereum), 8453 (Base)`
    );
  }

  return chainIdNum;
};

