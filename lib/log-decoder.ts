import { ethers } from "ethers";
import { MINIMAL_ERC20_INTERFACE, WETH_INTERFACE } from "./smart-contracts-abi";

export function decodeLogs(logs: ReadonlyArray<ethers.Log>) {
  const decodedLogs = [];

  for (const log of logs) {
    try {
      if (
        log.topics[0] ===
        MINIMAL_ERC20_INTERFACE.getEvent("Transfer")!.topicHash
      ) {
        const decoded = MINIMAL_ERC20_INTERFACE.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (!decoded) throw new Error("Failed to decode ERC20 Transfer");

        decodedLogs.push({
          type: "ERC20 Transfer",
          contract: log.address,
          from: decoded.args.from,
          to: decoded.args.to,
          amount: decoded.args.amount,
        });
      } else if (
        log.topics[0] === WETH_INTERFACE.getEvent("Withdrawal")!.topicHash
      ) {
        const decoded = WETH_INTERFACE.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (!decoded) throw new Error("Failed to decode WETH Withdrawal");

        decodedLogs.push({
          type: "WETH Withdrawal",
          contract: log.address,
          src: decoded.args.src,
          wad: decoded.args.wad,
        });
      } else if (
        log.topics[0] === WETH_INTERFACE.getEvent("Deposit")!.topicHash
      ) {
        const decoded = WETH_INTERFACE.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (!decoded) throw new Error("Failed to decode WETH Deposit");

        decodedLogs.push({
          type: "WETH Deposit",
          contract: log.address,
          dst: decoded.args.dst,
          wad: decoded.args.wad,
        });
      }
    } catch (error) {
      decodedLogs.push({
        type: "Error decoding",
        log,
        error,
      });
    }
  }

  return decodedLogs;
}
