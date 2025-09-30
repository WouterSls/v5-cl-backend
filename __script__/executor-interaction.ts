import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { Executor } from "../src/resources/blockchain/smartcontracts/executor/Executor";
import { EXECUTOR_INTERFACE } from "../src/resources/blockchain/smartcontracts/executor/executor-abi";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { ERC20_INTERFACE } from "../src/resources/blockchain/smartcontracts/erc20/erc20-abi";
import { PERMIT2_TYPES } from "../src/resources/blockchain/smartcontracts/permit2/permit2-types";
import { Permit2 } from "../src/resources/blockchain/smartcontracts/permit2/Permit2";
import { Order } from "../src/resources/blockchain/smartcontracts/executor/executor-types";

async function executorInteraction() {
  /**
   *
   *  SETUP
   *
   */
  const DEPLOYER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const TOKEN_A_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const TOKEN_B_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
  const EXECUTOR_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const localRpc = process.env.LOCAL_RPC;
  if (!localRpc) {
    throw new Error("RPC ENV ERROR");
  }

  const deployerKey = process.env.LOCAL_DEPLOYER_KEY;
  const userKey = process.env.LOCAL_USER_KEY;
  const relayerKey = process.env.LOCAL_RELAYER_KEY;

  if (!deployerKey || !userKey || !relayerKey) {
    throw new Error("PK ENV ERROR");
  }

  const provider = new JsonRpcProvider(localRpc);
  const deployer = new Wallet(deployerKey, provider);
  const relayer = new Wallet(relayerKey, provider);
  const user = new Wallet(userKey, provider);

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  const permit2: Permit2 = new Permit2(chainId, PERMIT2_ADDRESS);

  const executorContract = new ethers.Contract(
    EXECUTOR_ADDRESS,
    EXECUTOR_INTERFACE,
    provider
  );
  const tokenA = new ethers.Contract(
    TOKEN_A_ADDRESS,
    ERC20_INTERFACE,
    provider
  );

  //const token = TOKEN_A_ADDRESS;
  //const amount = "100";
  //const recipient = user.address;
  //await mintTokens(token, amount, recipient, relayer);
  //approvePermit2(token, user, PERMIT2_ADDRESS);

  /**
   *
   *  FRONTEND
   *    1. Check permit2 approval (inactive next button with approve permit2 message)
   *    2. Create order -> backend validation
   *    3. Sign order -> signature
   *
   */

  const inputAmount = ethers.parseUnits("100", 18);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1h expiry
  const orderNonce = Executor.getOrderNonce(user.address);
  const permit2Nonce = await permit2.getSignatureTransferNonce(user);

  const order: Order = {
    maker: user.address,
    inputToken: TOKEN_A_ADDRESS,
    inputAmount: inputAmount,
    outputToken: TOKEN_B_ADDRESS,
    minAmountOut: 0n,
    expiry: deadline,
    nonce: orderNonce,
  };

  const domain = permit2.getDomain();
  const types = {
    TokensPermissions: PERMIT2_TYPES.TokenPermissions,
    PermitWitnessTransferFrom: PERMIT2_TYPES.PermitWitnessTransferFrom,
  };

  const witness = Executor.hashOrder(order); // bytes32 hashed value (0x...)

  const value = {
    permitted: {
      token: order.inputToken,
      amount: order.inputAmount,
    },
    spender: EXECUTOR_ADDRESS,
    nonce: permit2Nonce,
    deadline: deadline,
    witness: witness,
  };

  const signature = await user.signTypedData(domain, types, value);

  //
  //user acts as relayer
  //tx passes and relayer got permit tokens
}

async function mintTokens(
  tokenAddress: string,
  tokenAmount: string,
  recipient: string,
  relayer: Wallet
) {
  const encoder = ethers.AbiCoder.defaultAbiCoder();
  const selector = ethers.id("mint(address,uint256)").slice(0, 10);
  const args = encoder.encode(
    ["address", "uint256"],
    [recipient, ethers.parseUnits(tokenAmount, 18)]
  );
  const callData = ethers.concat([selector, args]);

  const txResponse = await relayer.sendTransaction({
    to: tokenAddress,
    data: callData,
  });
  const txReceipt = await txResponse.wait();

  if (!txReceipt && txReceipt!.status != 1) {
    throw new Error("Transaction failed");
  }
  console.log("Transaction success");
}

if (require.main === module) {
  executorInteraction().catch(console.error);
}

export { executorInteraction };
