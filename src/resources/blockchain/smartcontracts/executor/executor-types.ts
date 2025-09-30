export interface Order {
  maker: string;
  inputToken: string;
  inputAmount: bigint;
  outputToken: string;
  minAmountOut: bigint;
  expiry: number;
  nonce: number;
}

export interface Permit2TransferFrom {}

export interface Trade {
  order: Order;
  permit: Permit2TransferFrom;
  signature: string;
}
