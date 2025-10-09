import { Router } from "express";
import { importToken, blacklistToken, getWalletTokenBalances } from "./WalletController";

const walletRouter = Router();

walletRouter.get("wallets/:address/chains/:chainId/token-balances", getWalletTokenBalances);

walletRouter.put("wallets/:address/chains/:chainId/import", importToken);
walletRouter.put("wallets/:address/chains/:chainId/blacklist", blacklistToken);

export { walletRouter };
