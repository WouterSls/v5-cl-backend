import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

import express from "express";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUI from "swagger-ui-express";
import cors from "cors";



import { Router } from "express";

//import { errorHandler } from "./lib/middleware/errorHandler";
//import { authMiddleware } from "./lib/middleware/auth";

//import { walletRouter } from "./app/wallets/api/WalletRouter";
//import { tradeRouter } from "./app/trades/api/TradeRouter";

const app = express();

// GENERAL MIDDLEWARE
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  // CORS -> not needed in single served prod application
  app.use(cors({ origin: "*" }));

  // SWAGGER DOCS
  const openApiPath = path.join(__dirname, "./resources/static/openapi.yaml");
  const openApiContent = fs.readFileSync(openApiPath, "utf8");
  const openApiDoc = yaml.load(openApiContent) as any;
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(openApiDoc));
}

// API ROUTES
const protectedRouter = Router();
//protectedRouter.use(authMiddleware);
//protectedRouter.use(walletRouter);
//protectedRouter.use(tradeRouter);

app.use("/api/protected", protectedRouter);

// ERROR HANDLING MIDDLEWARE
//app.use(errorHandler);

export default app;