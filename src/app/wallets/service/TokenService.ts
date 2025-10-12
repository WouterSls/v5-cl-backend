import logger from "../../../lib/logger/logger";

import { InsertToken, SelectToken } from "../../../resources/db/schema";
import { TokenDto } from "../../../resources/generated/types";
import { TokenMetadata, TokenRepository } from "../db/TokenRepository";

export class TokenService {
    private tokenRepo: TokenRepository;

    constructor(tokenRepo?: TokenRepository) {
        this.tokenRepo = tokenRepo || TokenRepository.getInstance();
    }

    async getTokens(walletAddress: string, chainId: number): Promise<SelectToken[]> {
        return await this.tokenRepo.getTokens(walletAddress, chainId)
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

        return await this.tokenRepo.updateToken(walletAddress, chainId, tokenData.address, { status: "IMPORT" });
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

        return await this.tokenRepo.updateToken(walletAddress, chainId, tokenAddress, { status: "BLACKLIST" });
    }
}