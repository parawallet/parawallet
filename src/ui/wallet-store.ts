import { action, computed, observable } from "mobx";
import { IWallet } from "../core/wallet";


export class WalletAccount {

  public static readonly NA_ADDRESS = "Loading...";

  public readonly wallet: IWallet;
  @observable
  private walletAddress: string;
  @observable
  private totalBalance: number;

  // private transactions: any[];

  constructor(wallet: IWallet, address?: string, balance?: number) {
    this.wallet = wallet;
    this.walletAddress = address || WalletAccount.NA_ADDRESS;
    this.totalBalance = balance || 0;
  }

  @computed
  public get address() {
    return this.walletAddress;
  }

  @computed
  public get balance() {
    return this.totalBalance;
  }

  @action
  public update(address: string, balance: number) {
    this.walletAddress = address;
    this.totalBalance = balance;
  }

}

export class WalletStore {
  private readonly walletAccounts = new Map<string, WalletAccount>();
  @observable
  private activeWalletAccount: WalletAccount;

  constructor(wallets: IWallet[], activeWalletCode: string) {
    for (const w of wallets) {
      this.walletAccounts.set(w.code, new WalletAccount(w));
    }
    this.activeWalletAccount = this.getWalletAccount(activeWalletCode);
  }

  public getWalletAccount(walletCode: string): WalletAccount {
    const wa = this.walletAccounts.get(walletCode);
    if (!wa) {
      throw new Error("Invalid wallet code: " + walletCode);
    }
    return wa;
  }

  @computed
  public get activeAccount(): WalletAccount {
    return this.activeWalletAccount;
  }

  @computed
  public get activeWallet(): IWallet {
    return this.activeWalletAccount.wallet;
  }

  @action
  public switchWallet(walletCode: string): WalletAccount {
    this.activeWalletAccount = this.getWalletAccount(walletCode);
    return this.activeWalletAccount;
  }
}
