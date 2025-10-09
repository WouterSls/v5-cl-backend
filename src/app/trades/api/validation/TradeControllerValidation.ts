import { TradeSetupDto, CreateTradeExecutionRequest } from "../../../../resources/generated/types";
import { ValidationError } from "../../../../lib/types/error";
//import { Wallet as EthersWallet } from "ethers";
//import { mapNetworkNameToChainType } from "../../resources/blockchain/trading-engine/config/chain-config";

export const validateCreateTradeExecutionRequest = (tradeCreationRequets: CreateTradeExecutionRequest): void => {
  if (!tradeCreationRequets.chainType) {
    throw new ValidationError("Trade setup must have a valid ChainType");
  }


  if (!tradeCreationRequets.inputToken || typeof tradeCreationRequets.inputToken !== "string") {
    throw new ValidationError("Trade setup must have a valid input token");
  }

  /**
  if (!setup.inputTokenName || typeof setup.inputTokenName !== "string") {
    throw new ValidationError("Trade setup must have a valid input token");
  }
*/

  if (!tradeCreationRequets.inputAmount || typeof tradeCreationRequets.inputAmount !== "string" || tradeCreationRequets.inputAmount.trim() === "") {
    throw new ValidationError("Input amount is required and must be a non-empty string");
  }

  const numericAmount = Number(tradeCreationRequets.inputAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new ValidationError("Input amount must be a valid positive number");
  }

  if (!tradeCreationRequets.outputToken || typeof tradeCreationRequets.outputToken !== "string" || tradeCreationRequets.outputToken.trim() === "") {
    throw new ValidationError("Output token is required and must be a non-empty string");
  }

  const trimmedOutputToken = tradeCreationRequets.outputToken.trim();
  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;

  const isValidSymbol = trimmedOutputToken === "ETH" || trimmedOutputToken === "USDC";
  const isValidTokenAddress = ethAddressPattern.test(trimmedOutputToken);

  if (!isValidSymbol && !isValidTokenAddress) {
    throw new ValidationError("Output token must be 'ETH', 'USDC', or a valid Ethereum token address");
  }

  if (typeof tradeCreationRequets.isLimitOrder !== "boolean") {
    throw new ValidationError("isLimitTrade is required and must be a boolean");
  }

  if (typeof tradeCreationRequets.isStopLossOrder !== "boolean") {
    throw new ValidationError("isStopLoss is required and must be a boolean");
  }

  if (tradeCreationRequets.isStopLossOrder && tradeCreationRequets.isLimitOrder) {
    throw new ValidationError("Trade must either be limit order or stop loss order");
  }

  if (tradeCreationRequets.isLimitOrder || tradeCreationRequets.isStopLossOrder) {
    if (tradeCreationRequets.tradingPrice === undefined || tradeCreationRequets.tradingPrice === null) {
      throw new ValidationError("Trading price is required for limit trades and stop loss trades");
    }

    if (typeof tradeCreationRequets.tradingPrice !== "number" || tradeCreationRequets.tradingPrice <= 0) {
      throw new ValidationError("Trading price must be a positive number");
    }
  }
};

export const validateTradeExecutionId = (id: string): number => {
  const numericId = Number(id);

  if (isNaN(numericId) || numericId < 0) {
    throw new ValidationError("TradeExecution ID must be a positive number");
  }

  return numericId;
};