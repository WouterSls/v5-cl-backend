import { formatUnits, getNumber } from "ethers";
import { AlchemyTokenBalancesResponse, TokenBalance } from "../../resources/blockchain/external-apis/alchemy/alchemy-api.types";
import { getYearnTokenMetadata } from "../../resources/blockchain/external-apis/yearn/yearn-utils";
import logger from "../logger/logger";
import { TokenDto } from "../../resources/generated/types";
import { SelectToken } from "../../resources/db/schema";
import { ImportedToken } from "../../app/wallets/model/ImportedToken";

const DUST_THRESHOLD = 0.000001;

const SPAM_TOKEN_PATTERNS = [
    /claim/i,
    /airdrop/i,
    /free/i,
    /visit/i,
    /\.com/i,
    /\.io/i,
    /bonus/i,
    /reward/i,
];

const NATIVE_TOKENS: Record<
    number,
    { symbol: string; name: string; decimals: number }
> = {
    1: { symbol: "ETH", name: "Ethereum", decimals: 18 },
    8453: { symbol: "ETH", name: "Ethereum", decimals: 18 },
};

const DEFAULT_TOKEN_DECIMALS = 18;
const DEFAULT_TOKEN_SYMBOL = "UNKNOWN";
const DEFAULT_TOKEN_NAME = "Unknown Token";

export function buildNativeToken(nativeBalanceHex: string, chainId: number): TokenDto {
    const nativeTokenInfo = NATIVE_TOKENS[chainId];
    const nativeBalanceBigInt = BigInt(nativeBalanceHex);
    const nativeBalanceFormatted = formatUnits(
        nativeBalanceBigInt,
        nativeTokenInfo.decimals
    );

    return {
        address: "native",
        symbol: nativeTokenInfo.symbol,
        name: nativeTokenInfo.name,
        decimals: nativeTokenInfo.decimals,
        balance: nativeBalanceBigInt.toString(),
        balanceFormatted: parseFloat(nativeBalanceFormatted).toFixed(6),
    };
}

export function buildTokens(tokenBalances: TokenBalance[], chainId: number, importedTokens: ImportedToken[], blacklistedAddresses: string[]): TokenDto[] {
    const tokensWithMetadata = enrichTokensWithMetadata(tokenBalances, chainId);

    const nonBlacklistedTokens = filterBlacklistedAddresses(tokensWithMetadata, blacklistedAddresses);

    const updatedDefaultTokens = enrichTokensWithImportedTokens(nonBlacklistedTokens, importedTokens);

    const nonDefaultTokens = filterTokensWithDefaultValues(updatedDefaultTokens);

    const tokens = filterSpamAndDust(nonDefaultTokens);

    logger.info("Token filtering complete", {
        initial: tokenBalances.length,
        afterMetadata: tokensWithMetadata.length,
        afterYearnFilter: nonDefaultTokens.length,
        final: tokens.length,
    });

    return tokens;
}

function enrichTokensWithMetadata(
    tokenBalances: TokenBalance[],
    chainId: number
): TokenDto[] {
    logger.debug("Enriching tokens with metadata", {
        tokenCount: tokenBalances.length,
        chainId,
    });

    const allTokens = tokenBalances.map((tokenBalance) => {
        try {
            const yearnMetadata = getYearnTokenMetadata(tokenBalance.contractAddress, chainId);

            const name = yearnMetadata ? yearnMetadata.name : DEFAULT_TOKEN_NAME;
            const symbol = yearnMetadata ? yearnMetadata.symbol : DEFAULT_TOKEN_SYMBOL;
            const decimals = yearnMetadata ? yearnMetadata.decimals : DEFAULT_TOKEN_DECIMALS;
            const logo = yearnMetadata ? yearnMetadata.logoURI : null;

            const balanceBigInt = BigInt(tokenBalance.tokenBalance);
            const balanceFormatted = formatUnits(balanceBigInt, decimals);

            const tokenDto: TokenDto = {
                address: tokenBalance.contractAddress,
                symbol,
                name,
                decimals,
                balance: balanceBigInt.toString(),
                balanceFormatted: parseFloat(balanceFormatted).toFixed(6),
                logo
            };

            return tokenDto;
        } catch (error) {
            logger.error("Failed to build token", {
                contractAddress: tokenBalance.contractAddress,
                chainId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    });

    const validTokens = allTokens.filter((token): token is TokenDto => token !== null);

    logger.debug("Enriched tokens with metadata", {
        total: tokenBalances.length,
        successful: validTokens.length,
        failed: tokenBalances.length - validTokens.length,
    });

    return validTokens;
}

function enrichTokensWithImportedTokens(allTokenDtos: TokenDto[], importedTokens: ImportedToken[]): TokenDto[] {
    logger.debug("Enriching tokens with imported tokens", {
        tokenCount: allTokenDtos.length,
        importedTokenCount: importedTokens.length
    });

    const importedTokenMap = new Map<string, ImportedToken>();
    
    for (const importedToken of importedTokens) {
        const address = importedToken.getAddress().toLowerCase();
        if (!importedTokenMap.has(address)) {
            importedTokenMap.set(address, importedToken);
        }
    }

    const tokens: TokenDto[] = [];
    for (const token of allTokenDtos) {
        const tokenAddress = token.address.toLowerCase();
        const importedToken = importedTokenMap.get(tokenAddress);
        
        if (importedToken && token.name === DEFAULT_TOKEN_NAME) {
            const enrichedToken: TokenDto = {
                ...token,
                address: importedToken.getAddress(),
                name: importedToken.getName(),
                symbol: importedToken.getSymbol(),
                decimals: importedToken.getDecimals(),
                balance: importedToken.getBalance(),
                balanceFormatted: parseFloat(formatUnits(importedToken.getBalance(), importedToken.getDecimals())).toFixed(6),
                logo: importedToken.getLogo()
            };
            tokens.push(enrichedToken);
        } else {
            tokens.push(token);
        }
    }

    logger.debug("Enriched tokens with imported metadata", {
        total: tokens.length,
        enriched: tokens.filter(t => t.name !== DEFAULT_TOKEN_NAME).length
    });

    return tokens;
}

function filterTokensWithDefaultValues(tokens: TokenDto[]): TokenDto[] {
    const initialCount = tokens.length;

    const yearnTokens = tokens.filter((token) => token.symbol !== DEFAULT_TOKEN_SYMBOL);

    const filteredCount = initialCount - yearnTokens.length;

    logger.debug("Filtered tokens with default values", {
        initialCount,
        yearnTokensCount: yearnTokens.length,
        filteredCount,
    });

    return yearnTokens;
}

function filterSpamAndDust(tokens: TokenDto[]): TokenDto[] {
    return tokens.filter((token) => {
        const isNotDust = parseFloat(token.balanceFormatted) >= DUST_THRESHOLD;
        const tokenText = `${token.name} ${token.symbol}`.toLowerCase();
        const isNotSpam = !SPAM_TOKEN_PATTERNS.some((pattern) => pattern.test(tokenText));

        return isNotDust && isNotSpam;
    });
}

function filterBlacklistedAddresses(tokens: TokenDto[], blacklistedAddresses: string[]): TokenDto[] {
    return tokens.filter((token) => !blacklistedAddresses.includes(token.address))
}
