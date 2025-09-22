import {
  ethers,
  id,
  concat,
  dataSlice,
  Contract,
  Wallet,
  FunctionFragment,
} from "ethers";
import { TransactionRequest } from "ethers/lib.esm";
import { MOCK_ERC20_INTERFACE } from "../lib/smart-contracts-abi";

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
  constructor() {}

  async execute(
    smartWalletAddress: string,
    executeParameters: {
      dest: string;
      value: number;
      callData: string;
    },
    wallet: Wallet
  ) {
    const callTarget = executeParameters.dest;
    //const code = await wallet.provider!.getCode(callTarget);
    const mockERC20 = new Contract(callTarget, MOCK_ERC20_INTERFACE, wallet);
    const name = await mockERC20.name();
    console.log("ERC20 MOCK NAME:");
    console.log(name);

    const executeSelector =
      MINIMAL_ACCOUNT_INTERFACE.getFunction("execute")?.selector;

    // Method 2: Using id() function
    const executeSelector2 = id("execute(address,uint256,bytes)");

    //console.log("FUNCTION SELECTOR (Method 1):", executeSelector);
    //console.log("FUNCTION SELECTOR (Method 2):", executeSelector2);
    //console.log("FUNCTION FRAGMENT:", executeFunction);

    const executeTxData = MINIMAL_ACCOUNT_INTERFACE.encodeFunctionData(
      "execute",
      [
        executeParameters.dest,
        executeParameters.value,
        executeParameters.callData,
      ]
    );

    const tx: TransactionRequest = {
      to: smartWalletAddress,
      data: executeTxData,
    };

    try {
      //await wallet.call(tx);
    } catch (error: unknown) {
      console.error(error);
      console.log();
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.log("WALLET CALL ERROR");
      console.log(errorMessage);
    }
  }
}
