export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  logo?: string | null;
}

export interface WalletTokenBalances {
  nativeToken: Token;
  tokenBalances: Token[];
}

