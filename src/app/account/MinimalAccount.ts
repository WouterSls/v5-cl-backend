import {
  ethers,
  id,
  concat,
  dataSlice,
  Contract,
  Wallet,
  FunctionFragment,
  TransactionReceipt,
  TransactionRequest
} from "ethers";
import { MOCK_ERC20_INTERFACE } from "../../../lib/smart-contracts-abi";
import { decodeLogs } from "../../../lib/log-decoder";

interface IChainConfig {
  chainId: bigint;
  usdcAddress: string;
}

const chainConfig: IChainConfig = {
  chainId: 31337n,
  usdcAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
};

const MINIMAL_ACCOUNT_INTERFACE = new ethers.Interface([
  "function execute(address dest, uint256 value, bytes functionData)",
]);

export class MinimalAccount {
  constructor(private smartWalletAddress: string) {}

  async execute(
    executeParameters: {
      dest: string;
      value: number;
      functionData: string;
    },
    wallet: Wallet
  ): Promise<ReadonlyArray<ethers.Log>> {
    const executeTxData = MINIMAL_ACCOUNT_INTERFACE.encodeFunctionData(
      "execute",
      [
        executeParameters.dest,
        executeParameters.value,
        executeParameters.functionData,
      ]
    );

    const tx: TransactionRequest = {
      to: this.smartWalletAddress,
      data: executeTxData,
    };

    try {
      await wallet.call(tx);
      console.log("Call passed!");
    } catch (error: unknown) {
      console.error(error);
      console.log();
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.log("WALLET CALL ERROR");
      console.log(errorMessage);
    }

    console.log("sending transaction...");
    const txResponse = await wallet.sendTransaction(tx);
    const txReceipt: TransactionReceipt | null = await txResponse.wait();
    if (!txReceipt && txReceipt!.status != 1) {
      console.log("TRANSACTION FAILED");
      console.log("TX REPONSE:");
      console.log(txResponse);
      console.log();
      console.log("TX RECEIPT:");
      console.log(txReceipt);
    }
    console.log("success");
    return txReceipt!.logs;
  }

  async getSmartAccountERC20Balance(erc20Address: string, wallet: Wallet) {
    const contract = new ethers.Contract(
      erc20Address,
      MOCK_ERC20_INTERFACE,
      wallet
    );

    const decimals = await contract.decimals();
    const balanceOf = await contract.balanceOf(this.smartWalletAddress);
    return ethers.formatUnits(balanceOf, decimals);

    const tx: TransactionRequest = {
      to: erc20Address,
      data: MOCK_ERC20_INTERFACE.encodeFunctionData("balanceOf", [
        this.smartWalletAddress,
      ]),
    };

    const resultData = await wallet.call(tx);
    console.log("CALL RESULT:");
    console.log(resultData);

    const decoded = MOCK_ERC20_INTERFACE.decodeFunctionResult(
      "balanceOf",
      resultData
    );
    console.log(decoded);
  }
}
