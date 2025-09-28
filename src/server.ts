import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

import http from "http";

import app from "./app";

//import { TradeScanner } from "./app/trades/TradeScanner";
//import { EncryptionService } from "./lib/utils/encryptionUtils";

//import { WalletService } from "./app/wallets/service/WalletService";
//import { WalletRepository } from "./app/wallets/db/WalletRepository";
//import { ConnectionRepository } from "./app/wallets/db/ConnectionRepository";
//import { TradeExecutionRepository } from "./app/trades/db/TradeExecutionRepository";

const port = process.env.PORT || 8080;

async function startServer() {
  try {
    //EncryptionService.initialize();

    if (process.env.NODE_ENV === "development") {
      //const walletService = new WalletService(WalletRepository.getInstance(), ConnectionRepository.getInstance());
      //await walletService.initializeDummyData();

      //const tradeExecutionRepo = TradeExecutionRepository.getInstance();
      //await tradeExecutionRepo.initializeDummyData();
    }

    const server = http.createServer(app);

    //const tradeScanner = TradeScanner.getInstance();
    //tradeScanner.start();

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      if (process.env.NODE_ENV === "development") {
        console.log(`API documentation available at http://localhost:${port}/api-docs`);
      }
      if (process.env.NODE_ENV === "production") {
        console.log(`UI available at http://localhost:${port}`);
      }
    });

    process.on("SIGINT", async () => {
      console.log("Gracefully shutting down server...");
      //await tradeScanner.stop();

      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();