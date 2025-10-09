import path from "path";
import type { YearnToken, YearnTokenList } from "./yearn-token-list.types";
import { logger } from "../../../../lib/logger/logger";

const tokenListCache = new Map<number, Map<string, YearnToken>>();

function loadTokenListForChain(chainId: number): Map<string, YearnToken> {
    const map = new Map<string, YearnToken>();
    
    try {
        const tokenListPath = path.join(__dirname, `data/${chainId}-tokens.json`);
        const tokenList: YearnTokenList = require(tokenListPath);
        
        tokenList.tokens.forEach((token) => {
            const key = token.address.toLowerCase();
            map.set(key, token);
        });

        logger.info(`Loaded Yearn token list for chain ${chainId}`, {
            chainId,
            tokenCount: map.size,
        });
    } catch (error) {
        logger.warn(`No Yearn token list found for chain ${chainId}`, {
            chainId,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return map;
}

function getTokenMapForChain(chainId: number): Map<string, YearnToken> {
    if (!tokenListCache.has(chainId)) {
        const map = loadTokenListForChain(chainId);
        tokenListCache.set(chainId, map);
    }
    
    return tokenListCache.get(chainId)!;
}

export function getYearnTokenMetadata(address: string, chainId: number): YearnToken | null {
    const tokenMap = getTokenMapForChain(chainId);
    const key = address.toLowerCase();
    return tokenMap.get(key) || null;
}

export function isTokenInYearnList(address: string, chainId: number): boolean {
    const tokenMap = getTokenMapForChain(chainId);
    const key = address.toLowerCase();
    return tokenMap.has(key);
}

export function getYearnTokenListStats() {
    const stats = new Map<number, number>();
    
    tokenListCache.forEach((map, chainId) => {
        stats.set(chainId, map.size);
    });
    
    return {
        loadedChains: Array.from(tokenListCache.keys()),
        tokenCounts: Object.fromEntries(stats),
        totalLoaded: Array.from(stats.values()).reduce((sum, count) => sum + count, 0),
    };
}