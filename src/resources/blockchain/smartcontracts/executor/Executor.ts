import { ethers } from "ethers";
import { EXECUTOR_INTERFACE } from "./executor-abi";
import { Order } from "./executor-types";

export class Executor {
  private executorAddress: string;

  constructor(executorAddress: string) {
    this.executorAddress = executorAddress;
  }

  getAddress = () => this.executorAddress;

  // Creating of trade should be done in the frontend. backend should receive trade & create route data
  /** 
  static createTrade(): Trade {
    const order: Order = {};
    const permit: Permit2TransferFrom = {};
    const signature: string = "";

    const trade: Trade = {
      order,
      permit,
      signature,
    };

    return trade;
  }
  */

  static hashOrder(order: Order) {
    const ORDER_TYPE_DEF =
      "Order(address maker,address inputToken,uint256 inputAmount,address outputToken,uint256 minAmountOut,uint256 expiry,uint256 nonce)";

    const ORDER_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(ORDER_TYPE_DEF));

    console.log(ORDER_TYPEHASH);
    // NOTE: order field packing must exactly match the Solidity abi.encode(ORDER_TYPEHASH, ...)
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abiCoder.encode(
      [
        "bytes32",
        "address",
        "address",
        "uint256",
        "address",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        ORDER_TYPEHASH,
        order.maker,
        order.inputToken,
        BigInt(order.inputAmount), // STRING ON BIGINT DOESN'T MATTER FOR ENCODING
        order.outputToken,
        order.minAmountOut,
        order.expiry,
        order.nonce,
      ]
    );
    return ethers.keccak256(encoded); // bytes32 witness
  }

  static getOrderNonce(maker: string) {
    return 0;
  }

  private getDomain() {}
}
