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

tradeRouter.get("/trade-executions", getTradeExecutions);
tradeRouter.get("/trade-confirmations", getTradeConfirmations);
tradeRouter.get("/trade-errors", getTradeErrors);

tradeRouter.post("/trade-executions", createTradeExecution);
tradeRouter.put("/trade-executions/:id", cancelTradeExecution);

tradeRouter.get("/trade-executions/prices", getTradeExecutionsPrices);
tradeRouter.post("/quotes", quoteTradeExecution);


export { tradeRouter };