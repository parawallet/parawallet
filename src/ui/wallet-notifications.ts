import {shell} from "electron";
import { TransactionStatus, Wallet, WalletEventListener } from "../core/wallet";

export class WalletNotificationHandler implements WalletEventListener {

  private readonly wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  public onBalanceChange(address: string, previousAmount: number, currentAmount: number) {
    if (currentAmount < previousAmount) {
      return;
    }

    // tslint:disable-next-line
    new Notification("Para Wallet", {
      body: `${this.wallet.name} address ${address.slice(0, 7) + "..."} received ${currentAmount - previousAmount} ${this.wallet.code}s.`,
    });
    // TODO: open related wallet's addresses pane
  }

  public onTransactionComplete(txid: string, amount: number, status: TransactionStatus) {
    const noti = new Notification("Para Wallet", {
      body: `${this.wallet.name} transaction [${txid.slice(0, 11) + "..."}] is completed with ${status}.`,
    });
    noti.onclick = () => {
        const url = this.wallet.getExporerURL("tx") + txid;
        shell.openExternal(url);
    };
  }
}
