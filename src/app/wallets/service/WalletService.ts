import logger from "../../../lib/logger/logger";
import NodeCache from "node-cache";

import { AlchemyApi } from "../../../resources/blockchain/external-apis/alchemy/AlchemyApi";
import { BlockchainApiError, AppError } from "../../../lib/types/error";
import {
  buildImportedTokens,
  buildNativeToken,
  buildTokens,
} from "../../../lib/utils/token";
import {
  TokenDto,
  WalletTokenBalancesDto,
} from "../../../resources/generated/types";
import { TokenService } from "./TokenService";
import { ImportedToken } from "../model/ImportedToken";
import { SelectToken } from "../../../resources/db/schema";

export class WalletService {
  private alchemyApi: AlchemyApi;
  private tokenService: TokenService;

  private walletServiceCache: NodeCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes -> to long for production

  constructor(alchemyApi?: AlchemyApi, tokenService?: TokenService) {
    this.alchemyApi = alchemyApi || new AlchemyApi();
    this.tokenService = tokenService || new TokenService();
  }

  async getWalletTokenBalances(
    address: string,
    chainId: number
  ): Promise<WalletTokenBalancesDto> {
    const cacheKey = `${address.toLowerCase()}:${chainId}`;
    const cachedResult =
      this.walletServiceCache.get<WalletTokenBalancesDto>(cacheKey);

    if (cachedResult) {
      logger.debug("Cache hit for wallet token balances", {
        address,
        chainId,
      });
      return cachedResult;
    }

    logger.debug("Fetching wallet token balances (/wallets/{address}/chains/{chainId})", {
      address,
      chainId,
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
      });

      const provider = this.alchemyApi.getEthersProvider(chainId);
      const importedTokens: ImportedToken[] = await buildImportedTokens(
        address,
        importedDbToken,
        provider
      );

      const nativeToken: TokenDto = buildNativeToken(nativeBalanceHex, chainId);
      const tokens: TokenDto[] = buildTokens(
        tokenBalanceData,
        importedTokens,
        blacklistedAddresses,
        chainId
      );

      const result: WalletTokenBalancesDto = {
        nativeToken,
        tokenBalances: tokens,
      };

      this.walletServiceCache.set(cacheKey, result);

      logger.debug("Successfully fetched wallet token balances with user preferences", {
        address,
        chainId,
        tokenCount: tokens.length,
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new BlockchainApiError("getWalletTokenBalances", error as Error);
    }
  }
}
