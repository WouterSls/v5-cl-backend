//import { eq } from "drizzle-orm";
//import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { NotFoundError, TechnicalError } from "../../../lib/types/error";

//import { db } from "../../../resources/db/db";
//import * as schema from "../../../resources/db/schema";

//import { InsertConnection, SelectConnection, connection } from "../../../resources/db/schema";
//import { NotFoundError, TechnicalError } from "../../../lib/types/errors";

export interface SelectToken {

}

export interface InsertToken {
    isBlacklist: boolean;
}

export class TokenRepository {
  private static instance: TokenRepository;
  //private db: BetterSQLite3Database<typeof schema>;

  private constructor() {}

  public static getInstance(): TokenRepository {
    if (!TokenRepository.instance) {
        TokenRepository.instance = new TokenRepository();
    }
    return TokenRepository.instance;
  }

  async getTokensByWalletAddress(connectionId: number): Promise<SelectToken[]> {
    try {
    /**
      const result = await db.select().from(connection).where(eq(connection.id, connectionId)).limit(1);

      if (result.length === 0) {
        throw new NotFoundError(`No connection found with id:${connectionId}`);
      }

      return result[0];
    */
        return []
    } catch (error: unknown) {
      console.error("Error getting connection: ", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new TechnicalError(`Error getting connection: ${errorMessage}`);
    }
  }

  async createToken(newToken: InsertToken): Promise<SelectToken> {
    try {
    /**
      const result = await this.db.insert(connection).values(newConnection).returning();

      if (result.length === 0) {
        throw new TechnicalError("No data returned after inserting connection");
      }
    */

      return {}
    } catch (error: unknown) {
      console.error("Error creating connection", error);
      if (error instanceof TechnicalError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new TechnicalError(errorMessage);
    }
  }

  async updateToken(): Promise<SelectToken> {
    return {}
  } 
}