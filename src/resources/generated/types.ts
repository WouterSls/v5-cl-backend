import { components, operations } from "./openapi";
//import { ChainType } from "../blockchain/trading-engine/config/chain-config";

export type GetWalletBalancesResponse = operations["getWalletBalances"]["responses"]["200"]["content"]["application/json"];

export type CreateTradeExecutionRequest = components["schemas"]["CreateTradeExecutionRequest"];
export type CreateTradeExecutionResponse =
  operations["createTradeExecution"]["responses"][201]["content"]["application/json"];
export type UpdateTradeExecutionResponse = operations["updateTradeExecution"]["responses"][204];

export type GetTradeExecutionsResponse =
  operations["getTradeExecutions"]["responses"][200]["content"]["application/json"];
export type GetTradeConfirmationsResponse =
  operations["getTradeConfirmations"]["responses"][200]["content"]["application/json"];
export type GetTradeErrorsResponse = operations["getTradeErrors"]["responses"][200]["content"]["application/json"];

export type QuoteTradeExecutionResponse =
  operations["quoteTradeExecution"]["responses"][201]["content"]["application/json"];

export type GetTradeExecutionPricesResponse =
  operations["getTradeExecutionPrices"]["responses"][200]["content"]["application/json"];



// COMPONENTS
export type WalletBalancesDto = components["schemas"]["WalletBalancesDto"];
//export { ChainType };
export type TradeSetupDto = components["schemas"]["TradeSetupDto"];
export type TradeExecutionDto = components["schemas"]["TradeExecutionDto"];
export type QuoteDto = components["schemas"]["QuoteDto"];
export type TradeExecutionPricesDto = components["schemas"]["TradeExecutionsPricesDto"];
export type TradeConfirmationDto = components["schemas"]["TradeConfirmationDto"];
export type TradeErrorDto = components["schemas"]["TradeErrorDto"];

// ERRORS
export type ApiResponse = components["schemas"]["ApiResponse"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];