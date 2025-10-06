export interface Trade {
  order: Order;
  permit: PermitWitnessTransferFrom;
  signature: string;
}

export interface Order {
  maker: string;
  inputToken: string;
  inputAmount: bigint;
  outputToken: string;
  minAmountOut: bigint;
  expiry: number;
  nonce: number;
  authorizedExecutor: string;
}

export interface PermitWitnessTransferFrom {
  permitted: TokenPermissions;
  spender: string;
  nonce: number;
  deadline: number;
  witness: Order; // The witness is the Order struct for EIP-712 signing
}

interface TokenPermissions {
  token: string;
  amount: bigint;
}

export interface RouteData {
  protocol: Protocol;
  path: string[];
  fee: bigint[]; //empty for V2 protocols
}

export enum Protocol {
  UNISWAP_V2 = 0,
  UNISWAP_V3 = 1,
  SUSHISWAP = 2,
  BALANCER_V2 = 3,
  CURVE = 4,
  PANCAKESWAP_V2 = 5,
  PANCAKESWAP_V3 = 6,
  TRADER_JOE = 7,
  QUICKSWAP = 8,
}
