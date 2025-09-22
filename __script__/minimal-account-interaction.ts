import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { MinimalAccount } from "../src/MinimalAccount";
import dotenv from "dotenv";
import path from "path";
import { MOCK_ERC20_INTERFACE } from "../lib/smart-contracts-abi";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function minimalAccountInteraction() {
  const smartWalletAddress = "";
  const DEPLOYED_MOCKED_ERC20 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const pk = process.env.DEPLOYER_KEY;

  const rpcUrl = "http://127.0.0.1:8545";

  if (!pk) {
    throw new Error("PK ENV ERROR");
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet: Wallet = new Wallet(pk, provider);

  const minimalAccount = new MinimalAccount();
  const value = 0;
  //target address
  const dest = DEPLOYED_MOCKED_ERC20;

  const mintRecipient = wallet.address;
  const mintAmount = ethers.parseUnits("100", 18);
  const data = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [mintRecipient, mintAmount]
  );
  const selector = ethers.dataSlice(ethers.id("mint(address,uint256"), 0, 4);

  const callData = ethers.concat([selector, data]);
  console.log("CALL DATA1:");
  console.log(callData);

  const callData2 = MOCK_ERC20_INTERFACE.encodeFunctionData("mint", [
    mintRecipient,
    mintAmount,
  ]);

  console.log("CALL DATA2:");
  console.log(callData2);

  return;
  const executeParameters = {
    dest,
    value,
    callData,
  };
  await minimalAccount.execute(smartWalletAddress, executeParameters, wallet);
}

if (require.main === module) {
  minimalAccountInteraction().catch(console.error);
}
