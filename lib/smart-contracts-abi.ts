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

const MINIMAL_ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
] as const;

const WETH_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Withdrawal(address indexed src, uint256 wad)",
  "event Deposit(address indexed dst, uint256 wad)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address, address, uint256) external returns (bool)",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
] as const;

export const MOCK_ERC20_INTERFACE = new ethers.Interface(MOCK_ERC20_ABI);
export const MINIMAL_ERC20_INTERFACE = new ethers.Interface(MINIMAL_ERC20_ABI);
export const WETH_INTERFACE = new ethers.Interface(WETH_ABI);
