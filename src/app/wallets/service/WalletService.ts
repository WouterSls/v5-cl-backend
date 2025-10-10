import logger from "../../../lib/logger/logger";

import { AlchemyApi } from "../../../resources/blockchain/external-apis/alchemy/AlchemyApi";
import {
  BlockchainApiError,
  AppError,
} from "../../../lib/types/error";
import { buildNativeToken, buildTokensFromAlchemyData, buildTokensFromSelectTokens } from "../../../lib/utils/token";
import { TokenDto, WalletTokenBalancesDto } from "../../../resources/generated/types";
import { TokenRepository, TokenMetadata } from "../db/TokenRepository";
import { InsertToken, SelectToken } from "../../../resources/db/schema";

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
    logger.info("Fetching wallet token balances (/wallets/{address}/chains/{chainId})", {
      address,
      chainId
    });

    try {
      const [nativeBalanceHex, tokenBalanceData, importedSelectTokens] = await Promise.all([
        this.alchemyApi.getNativeBalance(address, chainId),
        this.alchemyApi.getTokenBalances(address, chainId),
        this.tokenRepo.getImportedTokens(address, chainId),
      ]);

      const nativeToken: TokenDto = buildNativeToken(nativeBalanceHex, chainId);
      const tokens: TokenDto[] = buildTokensFromAlchemyData(tokenBalanceData, chainId);
      const importedTokens: TokenDto[] = await buildTokensFromSelectTokens(importedSelectTokens);

      logger.info("Successfully fetched wallet token balances with user preferences", {
        address,
        chainId,
        defaultTokenCount: tokens.length,
        //finalTokenCount: finalTokens.length,
        //preferencesCount: userPreferences.length,
      });

      return {
        nativeToken,
        tokenBalances: tokens,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new BlockchainApiError("getWalletTokenBalances", error as Error);
    }
  }

  async importToken(
    walletAddress: string,
    chainId: number,
    tokenData: TokenDto
  ): Promise<SelectToken> {
    logger.info("Importing token", {
      walletAddress,
      chainId,
      tokenAddress: tokenData.address
    });

    const existingToken = await this.tokenRepo.getToken(
      walletAddress,
      chainId,
      tokenData.address
    );

    if (!existingToken) {
      const metadata: TokenMetadata = {
        symbol: tokenData.symbol,
        name: tokenData.name,
        decimals: tokenData.decimals,
        logo: tokenData.logo || null,
      };

      const newToken: InsertToken = {
        walletAddress,
        chainId,
        tokenAddress: tokenData.address,
        status: "IMPORT",
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        logo: metadata.logo,
      }

      return await this.tokenRepo.createToken(newToken);
    }

    return await this.tokenRepo.updateToken(walletAddress,chainId,tokenData.address,{status: "IMPORT"});
  }

  async blacklistToken(
    walletAddress: string,
    chainId: number,
    tokenAddress: string,
    tokenData?: TokenDto
  ): Promise<SelectToken> {
    logger.info("Blacklisting token", {
      walletAddress,
      chainId,
      tokenAddress
    });

    const existingToken = await this.tokenRepo.getToken(
      walletAddress,
      chainId,
      tokenAddress
    );

    if (!existingToken) {
      const newToken: InsertToken = {
        walletAddress,
        chainId,
        tokenAddress,
        status: "BLACKLIST",
        symbol: tokenData?.symbol || null,
        name: tokenData?.name || null,
        decimals: tokenData?.decimals || null,
        logo: tokenData?.logo || null,
      }
      return await this.tokenRepo.createToken(newToken);
    }

    return await this.tokenRepo.updateToken(walletAddress, chainId, tokenAddress, {status: "BLACKLIST"});
  }
}

