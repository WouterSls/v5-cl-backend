import logger from "../../../lib/logger/logger";

import { AlchemyApi } from "../../../resources/blockchain/external-apis/alchemy/AlchemyApi";
import {
  UnsupportedChainError,
  BlockchainApiError,
  ValidationError,
  AppError,
} from "../../../lib/types/error";
import { buildNativeToken, buildTokens } from "../../../lib/utils/token";
import { TokenDto, WalletTokenBalancesDto } from "../../../resources/generated/types";

export class WalletService {
  private alchemyApi: AlchemyApi;

  constructor(alchemyApi?: AlchemyApi) {
    this.alchemyApi = alchemyApi || new AlchemyApi();
  }

  async getWalletTokenBalances(
    address: string,
    chainId: number
  ): Promise<WalletTokenBalancesDto> {
    logger.info("Fetching wallet token balances (/wallets/{address}/chains/{chainId})", { address, chainId });

    try {
      this.validateInputs(address, chainId);

      const [nativeBalanceHex, tokenBalanceData] = await Promise.all([
        this.alchemyApi.getNativeBalance(address, chainId),
        this.alchemyApi.getTokenBalances(address, chainId),
      ]);

      const nativeToken: TokenDto = buildNativeToken(nativeBalanceHex, chainId);
      const tokens: TokenDto[] = buildTokens(tokenBalanceData, chainId);

      logger.info("Successfully fetched wallet native and token balances", {
        address,
        chainId,
        tokenCount: tokens.length,
      });

      return {
        nativeToken,
        tokenBalances: tokens,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new BlockchainApiError(
        "getWalletTokenBalances",
        error as Error
      );
    }
  }

  private validateInputs(address: string, chainId: number): void {
    if (!address || !chainId) {
      throw new ValidationError("Address and chainId are required");
    }

    if (!this.alchemyApi.isChainSupported(chainId)) {
      throw new UnsupportedChainError(chainId);
    }
  }
}

