import { Request, Response } from "express";
import { asyncHandler } from "../../../lib/middleware/errorHandler";
import { GetWalletTokenBalancesResponse } from "../../../resources/generated/types";
import {
  validateWalletAddress,
  validateChainId,
  validateTokenMetadata,
} from "./validation/WalletControllerValidation";
import { WalletService } from "../service/WalletService";

const walletService = new WalletService();

export const getWalletTokenBalances = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const address = validateWalletAddress(req.params.address);
    const chainId = validateChainId(req.params.chainId);

    const balances = await walletService.getWalletTokenBalances(
      address,
      chainId
    );

    const successResponse: GetWalletTokenBalancesResponse = {
      success: true,
      data: {
        message: "Wallet token balances retrieved successfully",
        balances,
      },
    };

    res.status(200).json(successResponse);
});

export const importToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const address = validateWalletAddress(req.params.address);
    const chainId = validateChainId(req.params.chainId);

    const tokenMetadata = validateTokenMetadata(req.body);

    //const succesResponse: ImportTokenResponse = {}
});

export const blacklistToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const address = validateWalletAddress(req.params.address);
    const chainId = validateChainId(req.params.chainId);

    //const succesResponse: BlacklistTokenResponse = {}
});