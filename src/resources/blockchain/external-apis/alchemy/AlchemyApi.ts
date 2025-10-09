import type {
  AlchemyTokenBalancesResponse,
  AlchemyTokenMetadataResponse,
} from "./alchemy-api.types";
import logger from "../../../../lib/logger/logger";

// Chain ID to Alchemy network mapping
const ALCHEMY_NETWORKS: Record<number, string> = {
  1: "eth-mainnet",
  8453: "base-mainnet",
  137: "polygon-mainnet",
  10: "opt-mainnet",
  42161: "arb-mainnet",
};

/**
 * AlchemyApi handles all direct API calls to Alchemy
 * Pure API client - no business logic
 */
export class AlchemyApi {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALCHEMY_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("ALCHEMY_API_KEY is required");
    }
  }

  /**
   * Get the Alchemy API URL for a specific chain
   */
  private getAlchemyUrl(chainId: number): string {
    const network = ALCHEMY_NETWORKS[chainId];

    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    return `https://${network}.g.alchemy.com/v2/${this.apiKey}`;
  }

  /**
   * Check if a chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return chainId in ALCHEMY_NETWORKS;
  }

  /**
   * Fetch token balances from Alchemy API
   */
  async getTokenBalances(
    address: string,
    chainId: number
  ): Promise<AlchemyTokenBalancesResponse> {
    logger.debug("Calling Alchemy API: getTokenBalances", { address, chainId });
    
    const url = this.getAlchemyUrl(chainId);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [address],
          id: 1,
        }),
      });

      if (!response.ok) {
        logger.error("Alchemy API HTTP error", {
          method: "getTokenBalances",
          address,
          chainId,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        logger.error("Alchemy API returned error", {
          method: "getTokenBalances",
          address,
          chainId,
          errorMessage: data.error.message,
        });
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      logger.debug("Successfully fetched token balances from Alchemy", {
        address,
        chainId,
        tokenCount: data.result?.tokenBalances?.length || 0,
      });

      return data.result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Alchemy API error")) {
        throw error;
      }
      
      logger.error("Network error calling Alchemy API", {
        method: "getTokenBalances",
        address,
        chainId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fetch token metadata from Alchemy API
   */
  async getTokenMetadata(
    contractAddress: string,
    chainId: number
  ): Promise<AlchemyTokenMetadataResponse> {
    logger.debug("Calling Alchemy API: getTokenMetadata", { contractAddress, chainId });
    
    const url = this.getAlchemyUrl(chainId);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenMetadata",
          params: [contractAddress],
          id: 1,
        }),
      });

      if (!response.ok) {
        logger.error("Alchemy API HTTP error", {
          method: "getTokenMetadata",
          contractAddress,
          chainId,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        logger.error("Alchemy API returned error", {
          method: "getTokenMetadata",
          contractAddress,
          chainId,
          errorMessage: data.error.message,
        });
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      logger.debug("Successfully fetched token metadata from Alchemy", {
        contractAddress,
        chainId,
        symbol: data.result?.symbol,
        name: data.result?.name,
      });

      return data.result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Alchemy API error")) {
        throw error;
      }
      
      logger.error("Network error calling Alchemy API", {
        method: "getTokenMetadata",
        contractAddress,
        chainId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fetch native token balance (ETH, MATIC, etc.)
   */
  async getNativeBalance(address: string, chainId: number): Promise<string> {
    logger.debug("Calling Alchemy API: getNativeBalance", { address, chainId });
    
    const url = this.getAlchemyUrl(chainId);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [address, "latest"],
          id: 1,
        }),
      });

      if (!response.ok) {
        logger.error("Alchemy API HTTP error", {
          method: "getNativeBalance",
          address,
          chainId,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        logger.error("Alchemy API returned error", {
          method: "getNativeBalance",
          address,
          chainId,
          errorMessage: data.error.message,
        });
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      logger.debug("Successfully fetched native balance from Alchemy", {
        address,
        chainId,
        balance: data.result,
      });

      return data.result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Alchemy API error")) {
        throw error;
      }
      
      logger.error("Network error calling Alchemy API", {
        method: "getNativeBalance",
        address,
        chainId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
