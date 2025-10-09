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
import { InsertToken, TokenRepository } from "../db/TokenRepository";

export class WalletService {
  private alchemyApi: AlchemyApi;
  private tokenRepo: TokenRepository;

  constructor(alchemyApi?: AlchemyApi, tokenRepo?: TokenRepository) {
    this.alchemyApi = alchemyApi || new AlchemyApi();
    this.tokenRepo = tokenRepo || TokenRepository.getInstance();
  }

  async getWalletTokenBalances(
    address: string,
    chainId: number
  ): Promise<WalletTokenBalancesDto> {
    logger.info("Fetching wallet token balances (/wallets/{address}/chains/{chainId})", { address, chainId });

    try {
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

  async importToken(walletAddress: string, chainId: number, token: TokenDto) {
    const newToken: InsertToken = {isBlacklist: false}; 
    await this.tokenRepo.createToken(newToken);
  }

  async blacklistToken() {
    await this.tokenRepo.updateToken(/**isBlacklist = true */)
  }
}

