import { Contract, Wallet } from "ethers";
import { Permit2Domain } from "./permit2-types";
import { PERMIT2_INTERFACE } from "./permit2-abi";

export class Permit2 {
  constructor(private chainId: number, private permit2Address: string) {}

  getAddress = () => this.permit2Address;
  getDomain(): Permit2Domain {
    return {
      name: "Permit2",
      chainId: this.chainId,
      verifyingContract: this.permit2Address,
    };
  }

  async getSignatureTransferNonce(wallet: Wallet): Promise<string> {
    const permit2Contract = new Contract(
      this.permit2Address,
      PERMIT2_INTERFACE,
      wallet
    );
    const owner = wallet.address;

    let wordPos = 0;
    let foundAvailableNonce = false;
    while (!foundAvailableNonce) {
      const bitmap = await permit2Contract.nonceBitmap(owner, wordPos);

      for (let bitPos = 0; bitPos < 256; bitPos++) {
        const bit = BigInt(1 << bitPos);

        if ((bitmap & bit) === 0n) {
          const nonce = (BigInt(wordPos) << 8n) | BigInt(bitPos);
          foundAvailableNonce = true;
          return nonce.toString();
        }
      }

      wordPos++;

      if (wordPos > 1000000) {
        // 1 million words = 256 million nonces safety check to prevent infinite loop (though practically impossible)
        throw new Error(
          "No available nonces found after checking 1 million words"
        );
      }
    }

    throw new Error("No available nonces found");
  }
}
