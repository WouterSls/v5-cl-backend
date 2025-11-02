import { NotFoundError, TechnicalError } from "../../../lib/types/error";
import { supabase } from "../../../resources/db/supabase";
import {
  SelectToken,
  InsertToken
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
      const { data, error } = await supabase
        .from('token')
        .select()
        .eq('wallet_address', walletAddress)
        .eq('token_address', tokenAddress)
        .eq('chain_id', chainId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new TechnicalError(`Database error: ${error.message}`);
      }

      return data;
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
      const { data, error } = await supabase
        .from('token')
        .select()
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId);

      if (error) {
        throw new TechnicalError(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error: unknown) {
      console.error("Error getting tokens", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new TechnicalError(`Error getting tokens: ${errorMessage}`);
    }
  }

  async getTokensByStatus(
    walletAddress: string,
    chainId: number,
    status: "IMPORT" | "BLACKLIST"
  ): Promise<SelectToken[]> {
    try {
      const { data, error } = await supabase
        .from('token')
        .select()
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .eq('status', status);

      if (error) {
        throw new TechnicalError(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error: unknown) {
      console.error("Error getting tokens by status", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new TechnicalError(`Error getting tokens by status: ${errorMessage}`);
    }
  }

  async createToken(newToken: InsertToken): Promise<SelectToken> {
    try {
      const { data, error } = await supabase
        .from('token')
        .insert(newToken)
        .select()
        .single();

      if (error) {
        throw new TechnicalError(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new TechnicalError("No data returned after creating token");
      }

      return data;
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
      const { data, error } = await supabase
        .from('token')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('wallet_address', walletAddress)
        .eq('token_address', tokenAddress)
        .eq('chain_id', chainId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(
            `No token found for wallet: ${walletAddress}, token: ${tokenAddress}, chain: ${chainId}`
          );
        }
        throw new TechnicalError(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new NotFoundError(
          `No token found for wallet: ${walletAddress}, token: ${tokenAddress}, chain: ${chainId}`
        );
      }

      return data;
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