import logger from "../../../lib/logger/logger";
import { ethers } from "ethers";

import { InsertToken, SelectToken, token } from "../../../resources/db/schema";
import { TokenDto } from "../../../resources/generated/types";
import { TokenMetadata, TokenRepository } from "../db/TokenRepository";
import { ImportedToken } from "../model/ImportedToken";

export class TokenService {
    private tokenRepo: TokenRepository;

    constructor(tokenRepo?: TokenRepository) {
        this.tokenRepo = tokenRepo || TokenRepository.getInstance();
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

    async getBlacklistedAddresses(walletAddress: string, chainId: number): Promise<string[]> {
        const tokens = await this.tokenRepo.getTokens(walletAddress, chainId);
        const blacklistedAddresses = tokens.filter((token) => token.status == "BLACKLIST").map((token) => token.tokenAddress);
        return blacklistedAddresses;
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

    async getImportedTokens(walletAddress: string, chainId: number): Promise<ImportedToken[]> {
        const dbTokens = await this.tokenRepo.getTokens(walletAddress, chainId);

        const nonValidDbTokens = dbTokens.filter(
            (token) => token.status == "IMPORT" && 
                        (token.symbol == null || 
                         token.name == null || 
                         token.decimals == null)
        );

        const validDbTokens = dbTokens.filter(
            (token) => token.status == "IMPORT" && 
                        token.symbol != null && 
                        token.name != null && 
                        token.decimals != null
        );

        const provider = this.getProvider(chainId);

        const nonValidImportedTokens = await this.populateNonValidTokens(
            nonValidDbTokens, 
            walletAddress, 
            provider
        );

        const validImportedTokens = await this.populateValidTokens(
            validDbTokens, 
            walletAddress, 
            provider
        );

        return [...nonValidImportedTokens, ...validImportedTokens];
    }

    private async populateNonValidTokens(
        nonValidTokens: SelectToken[],
        walletAddress: string,
        provider: ethers.JsonRpcProvider
    ): Promise<ImportedToken[]> {
        logger.debug("Populating non-valid tokens with on-chain metadata + balance", {
            count: nonValidTokens.length,
            walletAddress
        });

        const importedTokens: ImportedToken[] = [];

        for (const token of nonValidTokens) {
            try {
                const metadata = await this.getTokenMetadataOnChain(
                    provider,
                    token.tokenAddress
                );

                const balance = await this.getTokenBalanceOnChain(
                    provider,
                    token.tokenAddress,
                    walletAddress
                );

                const importedToken = new ImportedToken(
                    token.tokenAddress,
                    metadata.name,
                    metadata.symbol,
                    metadata.decimals,
                    balance.toString(),
                    token.logo || ""
                );

                importedTokens.push(importedToken);

                logger.debug("Successfully populated non-valid token", {
                    tokenAddress: token.tokenAddress,
                    symbol: metadata.symbol,
                    name: metadata.name,
                    decimals: metadata.decimals,
                    balance: balance.toString()
                });
            } catch (error) {
                logger.error("Failed to populate non-valid token", {
                    tokenAddress: token.tokenAddress,
                    walletAddress,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        logger.info("Populated non-valid tokens", {
            attempted: nonValidTokens.length,
            successful: importedTokens.length
        });

        return importedTokens;
    }

    private async populateValidTokens(
        validTokens: SelectToken[],
        walletAddress: string,
        provider: ethers.JsonRpcProvider
    ): Promise<ImportedToken[]> {
        logger.debug("Populating valid tokens with on-chain balance", {
            count: validTokens.length,
            walletAddress
        });

        const importedTokens: ImportedToken[] = [];

        for (const token of validTokens) {
            try {
                const balance = await this.getTokenBalanceOnChain(
                    provider,
                    token.tokenAddress,
                    walletAddress
                );

                const importedToken = new ImportedToken(
                    token.tokenAddress,
                    token.name!,
                    token.symbol!,
                    token.decimals!,
                    balance.toString(),
                    token.logo || ""
                );

                importedTokens.push(importedToken);

                logger.debug("Successfully populated valid token", {
                    tokenAddress: token.tokenAddress,
                    balance: balance.toString()
                });
            } catch (error) {
                logger.error("Failed to populate valid token", {
                    tokenAddress: token.tokenAddress,
                    walletAddress,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        logger.info("Populated valid tokens", {
            attempted: validTokens.length,
            successful: importedTokens.length
        });

        return importedTokens;
    }

    private async getTokenMetadataOnChain(
        provider: ethers.JsonRpcProvider,
        tokenAddress: string
    ): Promise<{ name: string; symbol: string; decimals: number }> {
        const contract = new ethers.Contract(
            tokenAddress,
            [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)"
            ],
            provider
        );

        const [name, symbol, decimals] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals()
        ]);

        return {
            name,
            symbol,
            decimals: Number(decimals)
        };
    }

    private async getTokenBalanceOnChain(
        provider: ethers.JsonRpcProvider,
        tokenAddress: string,
        walletAddress: string
    ): Promise<bigint> {
        const contract = new ethers.Contract(
            tokenAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
        );
        
        const balance = await contract.balanceOf(walletAddress);
        return BigInt(balance.toString());
    }

    private getProvider(chainId: number): ethers.JsonRpcProvider {
        const alchemyKey = process.env.ALCHEMY_API_KEY;
        
        if (!alchemyKey) {
            throw new Error("ALCHEMY_API_KEY is required for on-chain token balance lookups");
        }
        
        const ALCHEMY_NETWORKS: Record<number, string> = {
            1: "eth-mainnet",
            8453: "base-mainnet",
        };
        
        const network = ALCHEMY_NETWORKS[chainId];
        
        if (!network) {
            throw new Error(`Unsupported chain ID for on-chain lookups: ${chainId}`);
        }
        
        const rpcUrl = `https://${network}.g.alchemy.com/v2/${alchemyKey}`;
        return new ethers.JsonRpcProvider(rpcUrl);
    }
}