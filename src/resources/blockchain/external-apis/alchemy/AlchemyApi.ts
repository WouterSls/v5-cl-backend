import logger from "../../../../lib/logger/logger";

import type {
  AlchemyTokenBalancesResponse,
  TokenBalance,
} from "./alchemy-api.types";

const ALCHEMY_NETWORKS: Record<number, string> = {
  1: "eth-mainnet",
  8453: "base-mainnet",
  //137: "polygon-mainnet",
  //10: "opt-mainnet",
  //42161: "arb-mainnet",
};

export class AlchemyApi {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALCHEMY_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("ALCHEMY_API_KEY is required");
    }
  }

  async getTokenBalances(
    address: string,
    chainId: number
  ): Promise<TokenBalance[]> {
    const allTokenBalances: TokenBalance[] = [];

    let pageKey: string | undefined;
    do {
      const params: unknown[] = [
        address,
        "erc20",
        pageKey ? { pageKey } : {},
      ];

      const response = await this.makeJsonRpcCall<AlchemyTokenBalancesResponse>(
        chainId,
        "alchemy_getTokenBalances",
        params,
        { address, pageKey: pageKey || "initial" }
      );

      const nonZeroTokens = this.filterNonZeroTokens(response.tokenBalances);
      allTokenBalances.push(...nonZeroTokens);

      pageKey = response.pageKey;
    } while (pageKey);

    return allTokenBalances;
  }

  async getNativeBalance(address: string, chainId: number): Promise<string> {
    return this.makeJsonRpcCall<string>(
      chainId,
      "eth_getBalance",
      [address, "latest"],
      { address }
    );
  }

  private getAlchemyUrl(chainId: number): string {
    const network = ALCHEMY_NETWORKS[chainId];

    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    return `https://${network}.g.alchemy.com/v2/${this.apiKey}`;
  }

  private async makeJsonRpcCall<T>(
    chainId: number,
    method: string,
    params: unknown[],
    logContext: Record<string, unknown> = {}
  ): Promise<T> {
    const url = this.getAlchemyUrl(chainId);

    logger.debug(`Calling Alchemy API: ${method}`, { chainId, ...logContext });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: 1,
        }),
      });

      if (!response.ok) {
        logger.error("Alchemy API HTTP error", {
          method,
          chainId,
          status: response.status,
          statusText: response.statusText,
          ...logContext,
        });
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        logger.error("Alchemy API returned error", {
          method,
          chainId,
          errorMessage: data.error.message,
          ...logContext,
        });
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      logger.debug(`Successfully called Alchemy API: ${method}`, {
        chainId,
        ...logContext,
      });

      return data.result as T;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Alchemy API error")) {
        throw error;
      }

      logger.error("Network error calling Alchemy API", {
        method,
        chainId,
        error: error instanceof Error ? error.message : String(error),
        ...logContext,
      });
      throw error;
    }
  }

  private filterNonZeroTokens(tokens: TokenBalance[]): TokenBalance[] {
    return tokens.filter(
      (token) =>
        !token.error &&
        token.tokenBalance !== "0" &&
        token.tokenBalance !== "0x0"
    );
  }
}
