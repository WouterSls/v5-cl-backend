import { Router } from "express";

import {
  createTradeExecution,
  getTradeExecutions,
  quoteTradeExecution,
  cancelTradeExecution,
  getTradeExecutionsPrices,
  getTradeConfirmations,
  getTradeErrors,
} from "./TradeController";

const tradeRouter = Router();

tradeRouter.get("/tradeExecutions", getTradeExecutions);
tradeRouter.get("/tradeConfirmations", getTradeConfirmations);
tradeRouter.get("/tradeErrors", getTradeErrors);

tradeRouter.post("/tradeExecutions", createTradeExecution);
tradeRouter.put("/tradeExecutions/:id", cancelTradeExecution);

tradeRouter.get("/tradeExecutions/prices", getTradeExecutionsPrices);
tradeRouter.post("/quotes", quoteTradeExecution);


export { tradeRouter };