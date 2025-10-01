import { ethers } from "ethers";

import { ERC20_INTERFACE, WETH_INTERFACE } from "../smartcontracts/erc20/erc20-abi";
import { PERMIT2_INTERFACE } from "../smartcontracts/permit2/permit2-abi";
import { EXECUTOR_INTERFACE } from "../smartcontracts/executor/executor-abi";

export function decodeLogs(logs: ReadonlyArray<ethers.Log>) {
  const decodedLogs = [] as any[];

  for (const log of logs) {
    try {
      if (log.topics[0] === ERC20_INTERFACE.getEvent("Transfer")!.topicHash) {
        const decoded = ERC20_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode ERC20 Transfer");
        decodedLogs.push({
          type: "ERC20 Transfer",
          contract: log.address,
          from: decoded.args.from,
          to: decoded.args.to,
          amount: decoded.args.amount,
        });
      } else if (log.topics[0] === ERC20_INTERFACE.getEvent("Approval")!.topicHash) {
        const decoded = ERC20_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode ERC20 Approval");
        decodedLogs.push({
          type: "ERC20 Approval",
          contract: log.address,
          owner: decoded.args.owner,
          spender: decoded.args.spender,
          value: decoded.args.value,
        });
      } else if (log.topics[0] === WETH_INTERFACE.getEvent("Withdrawal")!.topicHash) {
        const decoded = WETH_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode WETH Withdrawal");
        decodedLogs.push({
          type: "WETH Withdrawal",
          contract: log.address,
          src: decoded.args.src,
          wad: decoded.args.wad,
        });
      } else if (log.topics[0] === WETH_INTERFACE.getEvent("Deposit")!.topicHash) {
        const decoded = WETH_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode WETH Deposit");
        decodedLogs.push({
          type: "WETH Deposit",
          contract: log.address,
          dst: decoded.args.dst,
          wad: decoded.args.wad,
        });
      } else if (log.topics[0] === PERMIT2_INTERFACE.getEvent("UnorderedNonceInvalidation")!.topicHash) {
        const decoded = PERMIT2_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode Permit2 UnorderedNonceInvalidation");
        decodedLogs.push({
          type: "Permit2 UnorderedNonceInvalidation",
          contract: log.address,
          owner: decoded.args.owner,
          word: decoded.args.word,
          mask: decoded.args.mask,
        });
      } else if (log.topics[0] === PERMIT2_INTERFACE.getEvent("NonceInvalidation")!.topicHash) {
        const decoded = PERMIT2_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode Permit2 NonceInvalidation");
        decodedLogs.push({
          type: "Permit2 NonceInvalidation",
          contract: log.address,
          owner: decoded.args.owner,
          token: decoded.args.token,
          spender: decoded.args.spender,
          newNonce: decoded.args.newNonce,
          oldNonce: decoded.args.oldNonce,
        });
      } else if (log.topics[0] === PERMIT2_INTERFACE.getEvent("Approval")!.topicHash) {
        const decoded = PERMIT2_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode Permit2 Approval");
        decodedLogs.push({
          type: "Permit2 Approval",
          contract: log.address,
          owner: decoded.args.owner,
          token: decoded.args.token,
          spender: decoded.args.spender,
          amount: decoded.args.amount,
          expiration: decoded.args.expiration,
        });
      } else if (log.topics[0] === PERMIT2_INTERFACE.getEvent("Permit")!.topicHash) {
        const decoded = PERMIT2_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode Permit2 Permit");
        decodedLogs.push({
          type: "Permit2 Permit",
          contract: log.address,
          owner: decoded.args.owner,
          token: decoded.args.token,
          spender: decoded.args.spender,
          amount: decoded.args.amount,
          expiration: decoded.args.expiration,
          nonce: decoded.args.nonce,
        });
      } else if (log.topics[0] === PERMIT2_INTERFACE.getEvent("Lockdown")!.topicHash) {
        const decoded = PERMIT2_INTERFACE.parseLog({ topics: log.topics, data: log.data });
        if (!decoded) throw new Error("Failed to decode Permit2 Lockdown");
        decodedLogs.push({
          type: "Permit2 Lockdown",
          contract: log.address,
          owner: decoded.args.owner,
          token: decoded.args.token,
          spender: decoded.args.spender,
        });
      } else {
        decodedLogs.push({ type: "Unknown", address: log.address, topics: log.topics, data: log.data });
      }
    } catch (error) {
      decodedLogs.push({ type: "Error decoding", log, error });
    }
  }

  return decodedLogs;
}

export function decodeError(errorOrData: any) {
  const errorData: string | undefined = typeof errorOrData === "string"
    ? errorOrData
    : errorOrData?.data ?? errorOrData?.error?.data;

  if (!errorData || errorData === "0x" || typeof errorData !== "string") {
    return { type: "No error data", selector: null, decoded: null };
  }

  const selector = errorData.slice(0, 10);

  const interfaces = [
    { name: "Executor", interface: EXECUTOR_INTERFACE },
    { name: "Permit2", interface: PERMIT2_INTERFACE },
    { name: "ERC20", interface: ERC20_INTERFACE },
    { name: "WETH", interface: WETH_INTERFACE },
  ];

  for (const { name, interface: contractInterface } of interfaces) {
    try {
      const decoded = contractInterface.parseError(errorData);
      if (decoded) {
        return {
          type: "Decoded",
          contract: name,
          selector,
          errorName: decoded.name,
          signature: decoded.signature,
          args: decoded.args,
          decoded,
        };
      }
    } catch {
      // continue trying
    }
  }

  try {
    const iError = new ethers.Interface(["error Error(string)"]);
    const parsed = iError.parseError(errorData);
    if (parsed) return { type: "Error(string)", selector, message: parsed.args[0] };
  } catch {}

  try {
    const iPanic = new ethers.Interface(["error Panic(uint256)"]);
    const parsed = iPanic.parseError(errorData);
    if (parsed) return { type: "Panic(uint256)", selector, code: parsed.args[0].toString() };
  } catch {}

  return { type: "Unknown", selector, rawData: errorData, possibleParams: analyzeErrorParams(errorData) };
}

function analyzeErrorParams(errorData: string) {
  if (errorData.length <= 10) {
    return { analysis: "No parameters" };
  }

  const paramData = errorData.slice(10);
  const paramCount = paramData.length / 64;
  if (paramCount !== Math.floor(paramCount)) {
    return { analysis: "Invalid parameter length" };
  }

  const params = [] as any[];
  for (let i = 0; i < paramCount; i++) {
    const paramHex = paramData.slice(i * 64, (i + 1) * 64);
    const paramValue = BigInt("0x" + paramHex);
    if (paramHex.startsWith("000000000000000000000000") && paramHex.length === 64) {
      const address = "0x" + paramHex.slice(24);
      params.push({ index: i, hex: "0x" + paramHex, uint256: paramValue.toString(), possibleAddress: address, type: "address-like" });
    } else {
      params.push({ index: i, hex: "0x" + paramHex, uint256: paramValue.toString(), type: "uint256" });
    }
  }

  return { analysis: `${paramCount} parameters detected`, parameters: params };
}

