import { Order } from "../executor/executor-types";

export const PERMIT2_TYPES = {
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
  Order: [
    { name: "maker", type: "address" },
    { name: "inputToken", type: "address" },
    { name: "inputAmount", type: "uint256" },
    { name: "outputToken", type: "address" },
    { name: "minAmountOut", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  PermitWitnessTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "witness", type: "Order" }, // The witness is the Order struct (not bytes32) in executor contract
  ],
};

export type Permit2Domain = {
  name: "Permit2";
  chainId: number;
  verifyingContract: string;
};

//
// ISignatureTransfer.TokenPermissions
//
export interface TokenPermissions {
  token: string; // address
  amount: bigint; // uint256
}

export interface PermitTransferFrom {
  permitted: TokenPermissions;
  spender: string; // address
  nonce: string; // uint256
  deadline: string; // uint256
}

export interface PermitWitnessTransferFrom {
  permitted: TokenPermissions;
  spender: string; // address
  nonce: number; // uint256
  deadline: number; // uint256
  witness: Order; // The witness is the Order struct for EIP-712 signing -> the contract creates the hash
}

export interface SignatureTransferDetails {
  to: string; // address
  requestedAmount: bigint; // uint256
}

export interface PermitBatchTransferFrom {
  permitted: TokenPermissions[];
  nonce: string; // uint256
  deadline: string; // uint256
}

//
// IAllowanceTransfer.PermitDetails
//
export interface PermitSingle {
  details: PermitDetails;
  spender: string; // address
  sigDeadline: string; // uint256
}

export interface PermitBatch {
  details: PermitDetails[];
  spender: string; // address
  sigDeadline: string; // uint256
}

export interface PermitDetails {
  token: string; // address
  amount: string; // uint160 (use string for BN)
  expiration: string; // uint48 (use string)
  nonce: string; // uint48 (use string)
}
