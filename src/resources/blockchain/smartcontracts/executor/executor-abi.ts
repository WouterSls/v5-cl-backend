import { ethers } from "ethers";

const EXECUTOR_ABI = [
  "function PERMIT2() view returns (address)",
  "function traderRegistry() view returns (address)",
  "function executorFee() view returns (uint256)",
  "function owner() view returns (address)",
  "function usedNonce(address, uint256) view returns (bool)",
  "function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)",

  "function emergencyWithdrawToken(address token, address to)",
  "function cancelNonce(uint256 nonce)",

  "function executeTrade(tuple(tuple(address maker, address inputToken, uint256 inputAmount, address outputToken, uint256 minAmountOut, uint256 expiry, uint256 nonce) orderHash, tuple(tuple(address token, uint256 amount) permitted, uint256 nonce, uint256 deadline) permitHash, bytes signature) trade, tuple(uint8 protocol, address[] path, uint24 fee, bool isMultiHop, bytes encodedPath) routeData)",

  "function transferOwnership(address newOwner)",
  "function renounceOwnership()",
  "function updateExecutorFee(uint256 newFee)",
  "function updateTraderRegistry(address newRegistry)",

  "event EIP712DomainChanged()",
  "event ExecutorFeeUpdated(uint256 newFeeBps, address indexed updater)",
  "event ExecutorTipped(address indexed recipient, uint256 amount)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event TradeExecuted(address indexed maker, address indexed trader, uint256 amountIn, uint256 amountOut, uint256 amountTipped)",
  "event TraderRegistryUpdated(address indexed newRegistry, address indexed updater)",

  "error CallFailed()",
  "error InsufficientOutput()",
  "error InvalidFee()",
  "error InvalidRouter()",
  "error InvalidShortString()",
  "error InvalidTrader()",
  "error OwnableInvalidOwner(address owner)",
  "error OwnableUnauthorizedAccount(address account)",
  "error ReentrancyGuardReentrantCall()",
  "error SafeERC20FailedOperation(address token)",
  "error StringTooLong(string str)",
];

export const EXECUTOR_INTERFACE = new ethers.Interface(EXECUTOR_ABI);
