export interface YearnToken {
  address: string;
  name: string;
  symbol: string;
  logoURI?: string;
  chainId: number;
  decimals: number;
}

export interface YearnTokenList {
  name: string;
  description: string;
  timestamp: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  logoURI: string;
  keywords: string[];
  tokens: YearnToken[];
}


export interface YearnTokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

