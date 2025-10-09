import { Request, Response } from "express";
import { asyncHandler } from "../../../lib/middleware/errorHandler";
import {
  //ChainType,
  CreateTradeExecutionRequest,
  CreateTradeExecutionResponse,
  GetTradeConfirmationsResponse,
  GetTradeErrorsResponse,
  GetTradeExecutionPricesResponse,
  QuoteDto,
  QuoteTradeExecutionResponse,
} from "../../../resources/generated/types";


//import { TradeReceptionService } from "../TradeReceptionService";
//import { TradeExecutionService } from "../service/TradeExecutionService";
//import { TradeExecutionRepository } from "../db/TradeExecutionRepository";
//import { WalletRepository } from "../../wallets/db/WalletRepository";
//import { ConnectionRepository } from "../../wallets/db/ConnectionRepository";
//import { Quote } from "../../../resources/blockchain/trading-engine/trading/types/quoting-types";
//import { QuoteMapper, TradeErrorMapper, TradeExecutionMapper, TradeSetupMapper } from "./mapper/_index";
//import { WalletService } from "../../wallets/service/WalletService";
//import { TradeConfirmationService } from "../service/TradeConfirmationService";
//import { TradeConfirmationRepository } from "../db/TradeConfirmationRepository";
//import { TradeConfirmationMapper } from "./mapper/TradeConfirmationMapper";
//import { SelectTradeConfirmation, SelectTradeError } from "../../../resources/db/schema";
//import { TradeErrorService } from "../service/TradeErrorService";
//import { TradeErrorRepository } from "../db/TradeErrorRepository";

//const walletService = new WalletService(WalletRepository.getInstance(), ConnectionRepository.getInstance());
//const tradeExecutionService = new TradeExecutionService(TradeExecutionRepository.getInstance());
//const tradeConfirmationService = new TradeConfirmationService(TradeConfirmationRepository.getInstance());
//const tradeErrorService = new TradeErrorService(TradeErrorRepository.getInstance());

//const tradeService = new TradeReceptionService(tradeExecutionService, walletService);

export const quoteTradeExecution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  /**
  const requestBody: CreateTradeExecutionRequest = req.body;

  validateCreateTradeExecutionRequest(requestBody);

  const quote: Quote = await tradeService.quoteTradeExecution(requestBody);
  const quoteDto: QuoteDto = QuoteMapper.toQuoteDto(quote);

  const succesResponse: QuoteTradeExecutionResponse = {
    success: true,
    data: {
      message: "Trade Execution succesfully quoted",
      quote: quoteDto,
    },
  };

  res.status(201).json(succesResponse);
  */
});

export const getTradeExecutions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  /**
  const tradeExecutions = await tradeExecutionService.getTradeExecutions();
  const tradeExecutionDtos = TradeExecutionMapper.toTradeExecutionDtos(tradeExecutions);

  const successResponse = {
    success: true,
    data: {
      message: "Trade executions retrieved successfully",
      tradeExecutions: tradeExecutionDtos,
    },
  };

  res.status(200).json(successResponse);
  */
});

export const createTradeExecution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  /**
  const requestBody: CreateTradeExecutionRequest = req.body;

  validateCreateTradeExecutionRequest(requestBody);

  const tradeExecution = await tradeService.createTradeExecution(requestBody);
  const tradeExecutionDto = TradeExecutionMapper.toTradeExecutionDto(tradeExecution);

  const successResponse: CreateTradeExecutionResponse = {
    success: true,
    data: {
      message: "Trade execution created successfully",
      tradeExecution: tradeExecutionDto,
    },
  };

  res.status(201).json(successResponse);
 */
});

export const cancelTradeExecution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  /** 
  const tradeExecutionId = validateTradeExecutionId(req.params.id);

  await tradeExecutionService.cancelTradeExecution(tradeExecutionId);

  res.status(204).end();
  */
});

export const getTradeExecutionsPrices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  /**
  const tradeExecutions = await tradeExecutionService.getTradeExecutions();

  const pricesByChain = await tradeExecutionService.getPricesByChain(tradeExecutions);
  const tradeExecutionPricesDto = TradeExecutionMapper.toTradeExecutionsPricesDto(pricesByChain);

  const succesResponse: GetTradeExecutionPricesResponse = {
    success: true,
    data: {
      message: "Prices retrieved succesfully",
      prices: tradeExecutionPricesDto,
    },
  };

  res.status(200).json(succesResponse);
  */
});

export const getTradeConfirmations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
   /**
  const tradeConfirmations: SelectTradeConfirmation[] = await tradeConfirmationService.getTradeConfirmations();
  const tradeConfirmationsDtos = TradeConfirmationMapper.toTradeConfirmationDtos(tradeConfirmations);

  const successResponse: GetTradeConfirmationsResponse = {
    success: true,
    data: {
      message: "Trade confirmations retrieved successfully",
      tradeConfirmations: tradeConfirmationsDtos,
    },
  };

  res.status(200).json(successResponse);
  */
});

export const getTradeErrors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  /**
  const tradeErrors: SelectTradeError[] = await tradeErrorService.getTradeErrors();
  const tradeErrorDtos = TradeErrorMapper.toTradeErrorDtos(tradeErrors);

  const successResponse: GetTradeErrorsResponse = {
    success: true,
    data: {
      message: "Trade confirmations retrieved successfully",
      tradeErrors: tradeErrorDtos,
    },
  };

  res.status(200).json(successResponse);
  */
});