import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";

export class EthWallet extends AbstractWallet implements IWallet {
  constructor() {
    super("ETH", "Ethereum");
  }

  public update(callback?: BalanceCallback) {
    this.totalBalance = 0;
    if (callback) {
      callback("", 0);
    }
  }

  public send(toAddress: string, amount: number) {
    alert("wallet not available");
  }
}
