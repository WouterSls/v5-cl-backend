export const PERMIT2_TYPES = {
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
  PermitWitnessTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "witness", type: "bytes32" }, // IMPORTANT: this is the order-hash bytes32
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
