import { dataSlice, ethers, id, JsonRpcProvider, Wallet } from "ethers";
import { MinimalAccount } from "../src/app/account/MinimalAccount";
import dotenv from "dotenv";
import path from "path";
import { MOCK_ERC20_INTERFACE } from "../lib/smart-contracts-abi";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function minimalAccountInteraction() {
  const SMART_WALLET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const DEPLOYED_MOCKED_ERC20 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const pk = process.env.DEPLOYER_KEY;

  const rpcUrl = "http://127.0.0.1:8545";

  if (!pk) {
    throw new Error("PK ENV ERROR");
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet: Wallet = new Wallet(pk, provider);

  const minimalAccount = new MinimalAccount(SMART_WALLET_ADDRESS);
  const value = 0;
  //target address
  const dest = DEPLOYED_MOCKED_ERC20;

  const smartWalletBalance = await minimalAccount.getSmartAccountERC20Balance(
    DEPLOYED_MOCKED_ERC20,
    wallet
  );

  const mockERC20 = new ethers.Contract(
    DEPLOYED_MOCKED_ERC20,
    MOCK_ERC20_INTERFACE,
    wallet
  );

  const decimals = await mockERC20.decimals();
  const eoaWalletBalance = await mockERC20.balanceOf(wallet.address);

  const name = await mockERC20.name();
  console.log(name);
  console.log("==========================");

  console.log("SMART WALLET BALANCE:");
  console.log(smartWalletBalance);
  console.log();
  console.log("EOA WALLET BALANCE:");
  console.log(ethers.formatUnits(eoaWalletBalance, decimals));

  return;
  const mintRecipient = SMART_WALLET_ADDRESS;
  const mintAmount = ethers.parseUnits("100", 18);

  //await mockERC20.mint(mintRecipient, mintAmount);

  // CRAFT EXECUTE CALLBACK TRANSACTION DATA (function selector + default abi coder)
  /**
  const interfaceSelector = MOCK_ERC20_INTERFACE.getFunction("mint")!.selector;

  const fullSelector = id("mint(address,uint256)");
  const slicedIdSelector = dataSlice(fullSelector, 0, 4);
  const data = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [mintRecipient, mintAmount]
  );
  const functionData = ethers.concat([selector, data]);

  console.log("function data:");
  console.log(functionData);
 */

  const functionData2 = MOCK_ERC20_INTERFACE.encodeFunctionData("mint", [
    mintRecipient,
    mintAmount,
  ]);
  console.log("function data 2:");
  console.log(functionData2);

  const executeParameters = {
    dest,
    value,
    functionData: functionData2,
  };
  const executeLogs = await minimalAccount.execute(executeParameters, wallet);
  console.log("executeLogs");
  console.log(executeLogs);
}

if (require.main === module) {
  minimalAccountInteraction().catch(console.error);
}
