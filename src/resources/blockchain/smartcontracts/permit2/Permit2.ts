import { Contract, Wallet, Provider } from "ethers";
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

  /**
   * Split a nonce into its word position and bit position
   * @param nonce The nonce to split
   * @returns Object containing word (high 248 bits) and pos (low 8 bits)
   */
  static splitNonce(nonce: bigint): { word: bigint; pos: number } {
    return {
      word: nonce >> 8n,
      pos: Number(nonce & 0xffn),
    };
  }

  /**
   * Create a nonce from word and position
   * @param word The word position (high 248 bits)
   * @param pos The bit position (low 8 bits, 0-255)
   * @returns The combined nonce
   */
  static createNonce(word: bigint, pos: number): bigint {
    return (word << 8n) | BigInt(pos);
  }

  async getSignatureTransferNonce(wallet: Wallet): Promise<number> {
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
          return Number(nonce);
        }
      }

      wordPos++;

      const isInfiniteLoop = wordPos > 1000000;
      if (isInfiniteLoop) {
        const errorMessage =
          "Infinite Loop Prevention: No available nonces found after checking 1 million words";
        throw new Error(errorMessage);
      }
    }

    throw new Error("No available nonces found");
  }

  /**
   * Check if a specific nonce has been used
   * @param walletOrProvider Wallet or Provider to query the blockchain
   * @param owner The address to check nonces for
   * @param nonce The nonce to check
   * @returns true if the nonce has been used, false otherwise
   */
  async isNonceUsed(
    walletOrProvider: Wallet | Provider,
    owner: string,
    nonce: bigint
  ): Promise<boolean> {
    const permit2Contract = new Contract(
      this.permit2Address,
      PERMIT2_INTERFACE,
      walletOrProvider
    );

    const { word, pos } = Permit2.splitNonce(nonce);
    const bitmap = await permit2Contract.nonceBitmap(owner, word);
    const bit = (bitmap >> BigInt(pos)) & 1n;

    return bit === 1n;
  }

  /**
   * Get all used nonce positions in a specific word
   * @param walletOrProvider Wallet or Provider to query the blockchain
   * @param owner The address to check nonces for
   * @param word The word position to check
   * @returns Array of used bit positions (0-255)
   */
  async getUsedNoncesInWord(
    walletOrProvider: Wallet | Provider,
    owner: string,
    word: bigint
  ): Promise<number[]> {
    const permit2Contract = new Contract(
      this.permit2Address,
      PERMIT2_INTERFACE,
      walletOrProvider
    );

    const bitmap = await permit2Contract.nonceBitmap(owner, word);
    const usedPositions: number[] = [];

    for (let pos = 0; pos < 256; pos++) {
      if (((bitmap >> BigInt(pos)) & 1n) === 1n) {
        usedPositions.push(pos);
      }
    }

    return usedPositions;
  }

  /**
   * Cancel specific nonces by invalidating them in Permit2
   * @param wallet The wallet to sign the transaction
   * @param nonces Array of nonces to cancel
   * @returns Transaction receipt
   */
  async cancelNonces(wallet: Wallet, nonces: bigint[]) {
    const permit2Contract = new Contract(
      this.permit2Address,
      PERMIT2_INTERFACE,
      wallet
    );

    // Group nonces by word
    const noncesByWord = new Map<bigint, number[]>();

    for (const nonce of nonces) {
      const { word, pos } = Permit2.splitNonce(nonce);

      if (!noncesByWord.has(word)) {
        noncesByWord.set(word, []);
      }
      noncesByWord.get(word)!.push(pos);
    }

    // Cancel each word's nonces (send separate transactions if multiple words)
    const receipts = [];
    for (const [word, positions] of noncesByWord.entries()) {
      // Create bitmask for positions to cancel
      let mask = 0n;
      for (const pos of positions) {
        mask |= 1n << BigInt(pos);
      }

      const tx = await permit2Contract.invalidateUnorderedNonces(word, mask);
      const receipt = await tx.wait();
      receipts.push(receipt);
    }

    return receipts;
  }

  /**
   * Cancel all nonces in a specific word (0-255)
   * @param wallet The wallet to sign the transaction
   * @param word The word position to invalidate
   * @returns Transaction receipt
   */
  async cancelAllNoncesInWord(wallet: Wallet, word: bigint) {
    const permit2Contract = new Contract(
      this.permit2Address,
      PERMIT2_INTERFACE,
      wallet
    );

    // Create mask with all bits set (cancels all 256 nonces in this word)
    const maxMask = (1n << 256n) - 1n;

    const tx = await permit2Contract.invalidateUnorderedNonces(word, maxMask);
    return await tx.wait();
  }

  /**
   * Find the next available nonce for a user in a specific word
   * @param walletOrProvider Wallet or Provider to query the blockchain
   * @param owner The address to check nonces for
   * @param startWord The word to start searching from (default: 0)
   * @returns The next available nonce, or null if the word is full
   */
  async getNextAvailableNonceInWord(
    walletOrProvider: Wallet | Provider,
    owner: string,
    word: bigint
  ): Promise<bigint | null> {
    const permit2Contract = new Contract(
      this.permit2Address,
      PERMIT2_INTERFACE,
      walletOrProvider
    );

    const bitmap = await permit2Contract.nonceBitmap(owner, word);

    for (let pos = 0; pos < 256; pos++) {
      if (((bitmap >> BigInt(pos)) & 1n) === 0n) {
        return Permit2.createNonce(word, pos);
      }
    }

    return null; // All nonces in this word are used
  }
}
