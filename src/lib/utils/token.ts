import { formatUnits } from "ethers";
import { AlchemyTokenBalancesResponse, TokenBalance } from "../../resources/blockchain/external-apis/alchemy/alchemy-api.types";
import { getYearnTokenMetadata, isTokenInYearnList } from "../../resources/blockchain/external-apis/yearn/yearn-utils";
import logger from "../logger/logger";
import { TokenDto } from "../../resources/generated/types";
import { SelectToken } from "../../resources/db/schema";

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

export function buildTokensFromTokenBalances(tokenBalances: TokenBalance[], chainId: number): TokenDto[] {
    // Step 1: Enrich all tokens with metadata (Yearn > Defaults)
    const tokensWithMetadata = enrichTokensWithMetadata(tokenBalances, chainId);

    // Step 2: Filter tokens by Yearn list (security filter)
    const yearnFilteredTokens = filterTokensByYearnList(tokensWithMetadata, chainId);

    // Step 3: Filter spam and dust tokens
    const tokens = filterSpamAndDust(yearnFilteredTokens);

    logger.info("Token filtering complete", {
        initial: tokenBalances.length,
        afterMetadata: tokensWithMetadata.length,
        afterYearnFilter: yearnFilteredTokens.length,
        final: tokens.length,
    });

    return tokens;
}

export async function buildTokensFromSelectTokens(importedSelectTokens: SelectToken[]): Promise<TokenDto[]> {

    return [];
}

function filterSpamAndDust(tokens: TokenDto[]): TokenDto[] {
    return tokens.filter((token) => {
        const isNotDust = parseFloat(token.balanceFormatted) >= DUST_THRESHOLD;
        const tokenText = `${token.name} ${token.symbol}`.toLowerCase();
        const isNotSpam = !SPAM_TOKEN_PATTERNS.some((pattern) => pattern.test(tokenText));

        return isNotDust && isNotSpam;
    });
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

            if (tokenBalance.contractAddress == "0xab964f7b7b6391bd6c4e8512ef00d01f255d9c0d") {
                console.log("CORTEX FOUND");
            }
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

function filterTokensByYearnList(tokens: TokenDto[], chainId: number): TokenDto[] {
    const initialCount = tokens.length;

    const validTokens = tokens.filter((token) =>
        isTokenInYearnList(token.address, chainId)
    );

    const filteredCount = initialCount - validTokens.length;

    logger.debug("Filtered tokens by Yearn list", {
        initialCount,
        validCount: validTokens.length,
        filteredCount,
        chainId,
    });

    return validTokens;
}