import { ethers } from "ethers";
import { EXECUTOR_INTERFACE } from "./executor-abi";
import { Order } from "./executor-types";

export class Executor {
  private executorAddress: string;
  private ORDER_TYPE_DEF: string = "Order(address maker,address inputToken,uint256 inputAmount,address outputToken,uint256 minAmountOut,uint256 expiry,uint256 nonce)";
  private ORDER_TYPEHASH: string = ethers.keccak256(ethers.toUtf8Bytes(this.ORDER_TYPE_DEF));

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

  /**
  hashOrder(order: Order) {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
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
        this.ORDER_TYPEHASH,
        order.maker,
        order.inputToken,
        order.inputAmount,
        order.outputToken,
        order.minAmountOut,
        order.expiry,
        order.nonce,
      ]
    );
    return ethers.keccak256(encoded);
  }
  */

  static getOrderNonce(maker: string) {
    return 0;
  }
}
