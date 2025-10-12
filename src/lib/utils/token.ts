import logger from "../logger/logger";

import { formatUnits, ethers, JsonRpcProvider } from "ethers";
import { TokenBalance } from "../../resources/blockchain/external-apis/alchemy/alchemy-api.types";
import { getYearnTokenMetadata, isTokenInYearnList } from "../../resources/blockchain/external-apis/yearn/yearn-utils";
import { TokenDto } from "../../resources/generated/types";
import { SelectToken } from "../../resources/db/schema";
import { ImportedToken, createImportedToken } from "../../app/wallets/model/ImportedToken";

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

export async function buildImportedTokens(walletAddress: string, dbTokens: SelectToken[], provider: JsonRpcProvider) {
    const importPromises = dbTokens
        .filter(token => token.status === "IMPORT")
        .map(async (token) => {
            const isValid = (token.symbol != null && token.name != null && token.decimals != null);
            const tokenAddress = token.tokenAddress;

            let tokenName: string;
            let tokenSymbol: string;
            let tokenDecimals: number;

            if (isValid) {
                tokenName = token.name!;
                tokenSymbol = token.symbol!;
                tokenDecimals = token.decimals!;
            } else {
                const metadata = await getTokenMetadataOnChain(tokenAddress, provider);
                tokenName = metadata.name;
                tokenSymbol = metadata.symbol;
                tokenDecimals = metadata.decimals;
            }

            const tokenBalance = await getTokenBalanceOnChain(walletAddress, tokenAddress, provider);

            return createImportedToken(tokenAddress, tokenName, tokenSymbol, tokenDecimals, tokenBalance);
        });

    return await Promise.all(importPromises);
}

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

export function buildTokens(
    tokenBalances: TokenBalance[],
    importedTokens: ImportedToken[],
    blacklistedAddresses: string[],
    chainId: number,
): TokenDto[] {
    
    // Phase 1: Build filtered list (Yearn whitelist + imported tokens)
    const { addressesToPopulate, balanceMap, importedMap } = buildListToPopulate(
        chainId,
        tokenBalances,
        importedTokens,
        blacklistedAddresses
    );
    
    // Phase 2: Enrich each address (we know these are all legitimate)
    const enrichedTokens: TokenDto[] = [];
    let enrichedFromYearn = 0;
    let enrichedFromImported = 0;
    
    for (const address of addressesToPopulate) {
        const alchemyBalance = balanceMap.get(address);
        const importedToken = importedMap.get(address);
        
        // Get balance (prefer Alchemy as most up-to-date)
        const balance = alchemyBalance?.tokenBalance ?? importedToken?.balance;
        if (!balance) continue;
        
        // Get metadata (priority: Imported > Yearn)
        let name: string;
        let symbol: string;
        let decimals: number;
        let logo: string | null;
        
        if (importedToken) {
            // User imported - use their metadata
            name = importedToken.name;
            symbol = importedToken.symbol;
            decimals = importedToken.decimals;
            // Try to get logo from Yearn even for imported
            logo = getYearnTokenMetadata(address, chainId)?.logoURI || null;
            enrichedFromImported++;
        } else {
            // Must be in Yearn (we filtered for this earlier)
            const yearnMetadata = getYearnTokenMetadata(address, chainId)!;
            name = yearnMetadata.name;
            symbol = yearnMetadata.symbol;
            decimals = yearnMetadata.decimals;
            logo = yearnMetadata.logoURI ?? null;
            enrichedFromYearn++;
        }
        
        const balanceFormatted = parseFloat(
            formatUnits(balance, decimals)
        ).toFixed(6);
        
        enrichedTokens.push({
            address,
            symbol,
            name,
            decimals,
            balance,
            balanceFormatted,
            logo
        });
    }
    
    logger.info("Enrichment complete", {
        enriched: enrichedTokens.length,
        fromYearn: enrichedFromYearn,
        fromImported: enrichedFromImported
    });
    
    // Phase 3: Apply final dust and spam filter
    const finalTokens = enrichedTokens.filter(token => {
        const isNotDust = parseFloat(token.balanceFormatted) >= DUST_THRESHOLD;
        const tokenText = `${token.name} ${token.symbol}`.toLowerCase();
        const isNotSpam = !SPAM_TOKEN_PATTERNS.some((pattern) => pattern.test(tokenText));
        
        return isNotDust && isNotSpam;
    });
    
    logger.info("Final filtering complete", {
        afterDust: finalTokens.length,
        removedDust: enrichedTokens.length - finalTokens.length
    });
    
    return finalTokens;
}

function buildListToPopulate(
    chainId: number, 
    tokenBalances: TokenBalance[], 
    importedTokens: ImportedToken[], 
    blacklistedAddresses: string[]
) {
    const blacklistSet = new Set(blacklistedAddresses.map(addr => addr.toLowerCase()));
    const addressesToPopulate = new Set<string>();
    
    let skippedBlacklisted = 0;
    let skippedZeroBalance = 0;
    let skippedNotInYearn = 0;
    
    // Process Alchemy tokens: Only include if in Yearn list (spam filter)
    const balanceMap = new Map<string, TokenBalance>();
    for (const tokenBalance of tokenBalances) {
        const address = tokenBalance.contractAddress.toLowerCase();
        
        // Filter 1: Skip blacklisted
        if (blacklistSet.has(address)) {
            skippedBlacklisted++;
            continue;
        }
        
        // Filter 2: Skip zero balance (0x0 or "0x0000...")
        const balanceBigInt = BigInt(tokenBalance.tokenBalance);
        if (balanceBigInt === 0n) {
            skippedZeroBalance++;
            continue;
        }
        
        // Filter 3: Skip if NOT in Yearn list (spam/scam filter)
        if (!isTokenInYearnList(address, chainId)) {
            skippedNotInYearn++;
            continue;
        }
        
        // Passed all filters - add to populate list
        addressesToPopulate.add(address);
        balanceMap.set(address, tokenBalance);
    }
    
    // Process imported tokens: Always include (unless blacklisted)
    // User explicitly wants these, so they override Yearn filter
    const importedMap = new Map<string, ImportedToken>();
    for (const importedToken of importedTokens) {
        const address = importedToken.address.toLowerCase();
        
        if (blacklistSet.has(address)) {
            skippedBlacklisted++;
            continue;
        }
        
        // Imported tokens bypass Yearn filter and zero balance check
        addressesToPopulate.add(address);
        importedMap.set(address, importedToken);
    }
    
    logger.info("Built list to populate", {
        totalAddresses: addressesToPopulate.size,
        alchemyTokens: tokenBalances.length,
        alchemyKept: balanceMap.size,
        importedTokens: importedTokens.length,
        skippedBlacklisted,
        skippedZeroBalance,
        skippedNotInYearn
    });
    
    return {
        addressesToPopulate,
        balanceMap,
        importedMap
    };
}


async function getTokenBalanceOnChain(
    walletAddress: string,
    tokenAddress: string,
    provider: JsonRpcProvider
): Promise<string> {
    const TIMEOUT_MS = 10000; // 10 seconds

    try {
        const contract = new ethers.Contract(
            tokenAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
        );

        const balancePromise = contract.balanceOf(walletAddress);
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('RPC call timeout')), TIMEOUT_MS)
        );

        const balance = await Promise.race([balancePromise, timeoutPromise]);
        return balance.toString();
    } catch (error) {
        logger.error("Failed to fetch token balance from chain", {
            walletAddress,
            tokenAddress,
            error: error instanceof Error ? error.message : String(error)
        });
        // Return zero balance instead of throwing
        return "0";
    }
}

async function getTokenMetadataOnChain(
    tokenAddress: string,
    provider: JsonRpcProvider
): Promise<{ name: string; symbol: string; decimals: number }> {
    const TIMEOUT_MS = 10000; // 10 seconds
    const MAX_STRING_LENGTH = 100;
    const MAX_DECIMALS = 77;

    try {
        const contract = new ethers.Contract(
            tokenAddress,
            [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)"
            ],
            provider
        );

        const metadataPromise = Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals()
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('RPC call timeout')), TIMEOUT_MS)
        );

        const [name, symbol, decimals] = await Promise.race([metadataPromise, timeoutPromise]);

        // Validate and sanitize the data to prevent DoS
        return {
            name: typeof name === 'string' ? name.slice(0, MAX_STRING_LENGTH) : DEFAULT_TOKEN_NAME,
            symbol: typeof symbol === 'string' ? symbol.slice(0, MAX_STRING_LENGTH) : DEFAULT_TOKEN_SYMBOL,
            decimals: Number(decimals) > 0 && Number(decimals) <= MAX_DECIMALS ? Number(decimals) : DEFAULT_TOKEN_DECIMALS
        };
    } catch (error) {
        logger.error("Failed to fetch token metadata from chain", {
            tokenAddress,
            error: error instanceof Error ? error.message : String(error)
        });
        // Return defaults instead of throwing
        return {
            name: DEFAULT_TOKEN_NAME,
            symbol: DEFAULT_TOKEN_SYMBOL,
            decimals: DEFAULT_TOKEN_DECIMALS
        };
    }
}

