import { eq, and } from "drizzle-orm";
import { NotFoundError, TechnicalError } from "../../../lib/types/error";
import { db } from "../../../resources/db/db";
import {
  SelectToken,
  InsertToken,
  token
} from "../../../resources/db/schema";

export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
  logo?: string | null;
}

export class TokenRepository {
  private static instance: TokenRepository;

  private constructor() { }

  public static getInstance(): TokenRepository {
    if (!TokenRepository.instance) {
      TokenRepository.instance = new TokenRepository();
    }
    return TokenRepository.instance;
  }

  async getToken(
    walletAddress: string,
    chainId: number,
    tokenAddress: string
  ): Promise<SelectToken | null> {
    try {
      const result = await db
        .select()
        .from(token)
        .where(
          and(
            eq(token.walletAddress, walletAddress),
            eq(token.tokenAddress, tokenAddress),
            eq(token.chainId, chainId)
          )
        )
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error: unknown) {
      console.error("Error getting token", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new TechnicalError(`Error getting token: ${errorMessage}`);
    }
  }

  async getTokens(
    walletAddress: string,
    chainId: number,
  ): Promise<SelectToken[]> {
    try {
      const result = await db
        .select()
        .from(token)
        .where(
          and(
            eq(token.walletAddress, walletAddress),
            eq(token.chainId, chainId),
          )
        )

      return result;
    } catch (error: unknown) {
      console.error("Error getting token", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new TechnicalError(`Error getting token: ${errorMessage}`);
    }
  }

  async getTokensByStatus(
    walletAddress: string,
    chainId: number,
    status: "IMPORT" | "BLACKLIST"
  ): Promise<SelectToken[]> {
    try {
      const result = await db
        .select()
        .from(token)
        .where(
          and(
            eq(token.walletAddress, walletAddress),
            eq(token.chainId, chainId),
            eq(token.status, status)
          )
        )

      return result;
    } catch (error: unknown) {
      console.error("Error getting token", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new TechnicalError(`Error getting token: ${errorMessage}`);
    }
  }

  async createToken(newToken: InsertToken): Promise<SelectToken> {
    try {
      const result = await db.insert(token).values(newToken).returning();

      if (result.length === 0) {
        throw new TechnicalError("No data returned after creating token");
      }

      return result[0];
    } catch (error: unknown) {
      console.error("Error creating token", error);
      if (error instanceof TechnicalError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new TechnicalError(`Error creating token: ${errorMessage}`);
    }
  }

  async updateToken(
    walletAddress: string,
    chainId: number,
    tokenAddress: string,
    updates: Partial<InsertToken>
  ): Promise<SelectToken> {
    try {
      const result = await db
        .update(token)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(
            eq(token.walletAddress, walletAddress),
            eq(token.tokenAddress, tokenAddress),
            eq(token.chainId, chainId)
          )
        )
        .returning();

      if (result.length === 0) {
        throw new NotFoundError(
          `No token found for wallet: ${walletAddress}, token: ${tokenAddress}, chain: ${chainId}`
        );
      }

      return result[0];
    } catch (error: unknown) {
      console.error("Error updating token", error);
      if (error instanceof NotFoundError || error instanceof TechnicalError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new TechnicalError(`Error updating token: ${errorMessage}`);
    }
  }
}