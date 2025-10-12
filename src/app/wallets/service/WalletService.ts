import logger from "../../../lib/logger/logger";

import { AlchemyApi } from "../../../resources/blockchain/external-apis/alchemy/AlchemyApi";
import {
  BlockchainApiError,
  AppError,
} from "../../../lib/types/error";
import { buildImportedTokens, buildNativeToken, buildTokens } from "../../../lib/utils/token";
import { TokenDto, WalletTokenBalancesDto } from "../../../resources/generated/types";
import { TokenService } from "./TokenService";
import { ImportedToken } from "../model/ImportedToken";
import { SelectToken } from "../../../resources/db/schema";

export class WalletService {
  private alchemyApi: AlchemyApi;
  private tokenService: TokenService;

  constructor(alchemyApi?: AlchemyApi, tokenService?: TokenService) {
    this.alchemyApi = alchemyApi || new AlchemyApi();
    this.tokenService = tokenService || new TokenService();
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
      const [nativeBalanceHex, tokenBalanceData, dbTokens] = await Promise.all([
        this.alchemyApi.getNativeBalance(address, chainId),
        this.alchemyApi.getTokenBalances(address, chainId),
        this.tokenService.getTokens(address, chainId),
      ]);

      const blacklistedAddresses: string[] = [];
      const importedDbToken: SelectToken[] = [];
      dbTokens.forEach((token) => {
        if (token.status === "IMPORT") {
          importedDbToken.push(token);
        } else if (token.status === "BLACKLIST") {
          blacklistedAddresses.push(token.tokenAddress);
        }
      })

      const provider = this.alchemyApi.getEthersProvider(chainId);
      const importedTokens: ImportedToken[] = await buildImportedTokens(address, importedDbToken, provider);

      const nativeToken: TokenDto = buildNativeToken(nativeBalanceHex, chainId);
      const tokens: TokenDto[] = buildTokens(tokenBalanceData, importedTokens, blacklistedAddresses, chainId,);

      logger.info("Successfully fetched wallet token balances with user preferences", {
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

      throw new BlockchainApiError("getWalletTokenBalances", error as Error);
    }
  }
}

