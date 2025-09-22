import { ethers } from "ethers";

const MOCK_ERC20_ABI = [
  "constructor()",

  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",

  "function burn(address account, uint256 amount)",
  "function mint(address account, uint256 amount)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",

  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",

  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InvalidApprover(address approver)",
  "error ERC20InvalidReceiver(address receiver)",
  "error ERC20InvalidSender(address sender)",
  "error ERC20InvalidSpender(address spender)",
];

export const MOCK_ERC20_INTERFACE = new ethers.Interface(MOCK_ERC20_ABI);
