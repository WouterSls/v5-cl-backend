import { ethers } from "ethers";

export interface ImportedToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    balanceFormatted: string;
}

export function createImportedToken(
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    balance: string
): ImportedToken {
    return {
        address,
        name,
        symbol,
        decimals,
        balance,
        balanceFormatted: ethers.formatUnits(balance, decimals)
    };
}