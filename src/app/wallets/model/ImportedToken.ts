import { ethers } from "ethers";

export class ImportedToken {
    constructor(
        private address: string,
        private name: string,
        private symbol: string,
        private decimals: number,
        private balance: string,
        private logoUri: string
    ) {}

    getAddress = () => this.address; 
    getName = () => this.name;
    getSymbol = () => this.symbol;
    getDecimals = () => this.decimals;
    getBalance = () => this.balance;
    getBalanceFormatted = () => ethers.formatUnits(this.balance, this.decimals);
    getLogo = () => this.logoUri;
}