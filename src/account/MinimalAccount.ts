import { ethers, id, concat, dataSlice, Contract, Wallet } from "ethers";
import { TransactionRequest } from "ethers/lib.esm";

interface IChainConfig {
  chainId: bigint;
  usdcAddress: string;
}

const chainConfig: IChainConfig = {
  chainId: 31337n,
  usdcAddress: ethers.ZeroAddress,
};

const MINIMAL_ACCOUNT_INTERFACE = new ethers.Interface([
  "function execute(address dest, uint256 value, bytes functionData)",
]);

export class MinimalAccount {
  constructor(private address: string, private wallet: Wallet) {}

  async execute() {
    const value = 0;
    //target address
    const dest = chainConfig.usdcAddress;

    const mintRecipient = "";
    const mintAmount = "";
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [mintRecipient, mintAmount]
    );
    const selector = dataSlice(id("transfer(address,uint256"), 0, 4);
    const calldata = ethers.concat([selector, data]);

    const executeTxData = MINIMAL_ACCOUNT_INTERFACE.encodeFunctionData(
      "execute",
      [dest, value, calldata]
    );

    const tx: TransactionRequest = {
      to: this.address,
      data: executeTxData,
    };

    try {
      await this.wallet.call(tx);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.log("WALLET CALL ERROR");
      console.log(errorMessage);
    }
  }
}
