import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { Executor } from "../src/resources/blockchain/smartcontracts/executor/Executor";
import { EXECUTOR_INTERFACE } from "../src/resources/blockchain/smartcontracts/executor/executor-abi";
import {
  ethers,
  JsonRpcProvider,
  TransactionReceipt,
  TransactionRequest,
  Wallet,
} from "ethers";
import {
  ERC20_INTERFACE,
  ERC20_MOCK_INTERFACE,
} from "../src/resources/blockchain/smartcontracts/erc20/erc20-abi";
import { PERMIT2_TYPES } from "../src/resources/blockchain/smartcontracts/permit2/permit2-types";
import { Permit2 } from "../src/resources/blockchain/smartcontracts/permit2/Permit2";
import {
  Order,
  Protocol,
  RouteData,
  Trade,
} from "../src/resources/blockchain/smartcontracts/executor/executor-types";
import { PermitWitnessTransferFrom } from "../src/resources/blockchain/smartcontracts/permit2/permit2-types";
import { decodeLogs } from "../lib/log-decoder";
import { decodeError } from "../src/resources/blockchain/lib/decoding-utils";

// Witness type string that matches the contract's WITNESS_TYPE_STRING
const WITNESS_TYPE_STRING =
  "Order witness)Order(address maker,address inputToken,uint256 inputAmount,address outputToken,uint256 minAmountOut,uint256 expiry,uint256 nonce)TokenPermissions(address token,uint256 amount)";

async function executorInteraction() {
  /**
   *
   *  SETUP
   *
   */
  const DEPLOYER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const TOKEN_A_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const TOKEN_B_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  //const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
  const PERMIT2_ADDRESS = "0xBE05d211eD3fd34A1624060419358AA073957faC";
  const EXECUTOR_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

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

  const executor: Executor = new Executor(EXECUTOR_ADDRESS);
  const permit2: Permit2 = new Permit2(chainId, PERMIT2_ADDRESS);

  const executorContract = new ethers.Contract(
    EXECUTOR_ADDRESS,
    EXECUTOR_INTERFACE,
    provider
  );
  const tokenA = new ethers.Contract(
    TOKEN_A_ADDRESS,
    ERC20_MOCK_INTERFACE,
    provider
  );

  const deployerBalance = await tokenA.balanceOf(deployer.address);
  const userBalance = await tokenA.balanceOf(user.address);
  const relayerBalance = await tokenA.balanceOf(relayer.address);

  console.log("TOKEN A:", TOKEN_A_ADDRESS);
  console.log();
  console.log("DEPLOYER BALANCE\tUSER BALANCE\tRELAYER BALANCE");
  console.log(
    `${ethers.formatEther(deployerBalance)}\t\t\t${ethers.formatEther(
      userBalance
    )}\t\t${ethers.formatEther(relayerBalance)}`
  );
  console.log();

  const token = TOKEN_A_ADDRESS;
  const amount = "100";
  const recipient = user.address;
  //await mintTokens(token, amount, recipient, deployer);
  //await approvePermit2(token, user, PERMIT2_ADDRESS);

  /**
   *
   *  FRONTEND
   *    1. Check permit2 approval (inactive next button with approve permit2 message)
   *    2. Create order -> backend validation
   *    3. Sign order -> signature
   *
   */

  return;
  const inputAmount = ethers.parseUnits("10", 18);
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

  const permit: PermitWitnessTransferFrom = {
    permitted: {
      token: TOKEN_A_ADDRESS,
      amount: inputAmount,
    },
    spender: EXECUTOR_ADDRESS,
    nonce: permit2Nonce,
    deadline: deadline,
    witness: order,
  };

  const domain = permit2.getDomain();
  const types = {
    TokenPermissions: PERMIT2_TYPES.TokenPermissions,
    Order: PERMIT2_TYPES.Order,
    PermitWitnessTransferFrom: PERMIT2_TYPES.PermitWitnessTransferFrom,
  };
  const value = permit;

  const signature = await user.signTypedData(domain, types, value);

  const trade: Trade = {
    order: order,
    permit: permit,
    signature: signature,
  };

  const routeData: RouteData = {
    protocol: Protocol.UNISWAP_V2,
    path: [TOKEN_A_ADDRESS, TOKEN_B_ADDRESS],
    fee: "3000",
    isMultiHop: false,
    encodedPath: "0x",
  };

  const callData = EXECUTOR_INTERFACE.encodeFunctionData("executeTrade", [
    trade,
    routeData,
  ]);

  const executeTx: TransactionRequest = {
    to: EXECUTOR_ADDRESS,
    data: callData,
  };

  try {
    const txResponse = await relayer.sendTransaction(executeTx);
    const txReceipt = await txResponse.wait();
    if (!txReceipt || txReceipt!.status != 1) {
      console.log("Execute failed");
    }
    console.log("Execute succeeded");
    const decodedLogs = decodeLogs(txReceipt!.logs);
    console.log("DECODED LOGS");
    console.log("-------------------");
    console.log(decodedLogs);
  } catch (error) {
    const decoded = decodeError(error);
    if (decoded.type == "Decoded") {
      console.log("Decoded Error:", decoded);
    } else {
      console.log(error);
    }
  }
}

async function mintTokens(
  tokenAddress: string,
  tokenAmount: string,
  recipient: string,
  deployer: Wallet
) {
  const encoder = ethers.AbiCoder.defaultAbiCoder();
  const selector = ethers.id("mint(address,uint256)").slice(0, 10);
  const args = encoder.encode(
    ["address", "uint256"],
    [recipient, ethers.parseUnits(tokenAmount, 18)]
  );
  const callData = ethers.concat([selector, args]);

  const txResponse = await deployer.sendTransaction({
    to: tokenAddress,
    data: callData,
  });
  const txReceipt = await txResponse.wait();

  if (!txReceipt && txReceipt!.status != 1) {
    throw new Error("Mint failed");
  }
  console.log("Mint success");
}

async function approvePermit2(
  token: string,
  owner: Wallet,
  permit2Address: string
) {
  const encoder = ethers.AbiCoder.defaultAbiCoder();
  const selector = ethers.id("approve(address,uint256)").slice(0, 10);
  const args = encoder.encode(
    ["address", "uint256"],
    [permit2Address, ethers.MaxUint256]
  );
  const callData = ethers.concat([selector, args]);

  const txResponse = await owner.sendTransaction({
    to: token,
    data: callData,
  });
  const txReceipt = await txResponse.wait();

  if (!txReceipt && txReceipt!.status != 1) {
    throw new Error("Approve failed");
  }
  console.log("Approve success");
}

if (require.main === module) {
  executorInteraction().catch(console.error);
}

export { executorInteraction };
