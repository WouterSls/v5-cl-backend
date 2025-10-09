import { Router } from "express";
import { allowlistToken, blacklistToken, getWalletTokenBalances } from "./WalletController";

const walletRouter = Router();

// ADD WALLET HERE OR IN MAIN ROUTER?
walletRouter.get("/:address/chains/:chainId/tokenBalances", getWalletTokenBalances);

walletRouter.post("/:address/allowlist", allowlistToken);
walletRouter.post("/:address/blacklist", blacklistToken);

export { walletRouter };
