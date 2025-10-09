/**
 * Alchemy API response types
 * These are the raw response types from Alchemy API
 */

export interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string;
}

export interface AlchemyTokenBalancesResponse {
  address: string;
  tokenBalances: TokenBalance[];
}

export interface AlchemyTokenMetadataResponse {
  decimals: number;
  logo: string | null;
  name: string;
  symbol: string;
}