import { action, runInAction, computed, observable } from "mobx";
import SecoKeyval from "seco-keyval";
import * as C from "../constants";

export interface Balance {
  readonly address: string;
  readonly amount: number;
}

export interface WalletType {
  readonly code: string;
  readonly name: string;
}

export interface Wallet extends WalletType {

  /**
   * Total of current balances.
   */
  readonly totalBalanceAmount: number;

  /**
   * Current/latest balances.
   */
  readonly currentBalances: ReadonlyArray<Balance>;

  /**
   * Initializes the wallet, either by restoring from database
   * or creating an empty wallet.
   */
  initialize(createEmpty: boolean): Promise<any>;

  /**
   * Returns true if this wallet supports multi-address transactions,
   * false otherwise.
   */
  supportsMultiAddress(): boolean;

  /**
   * Returns true if address is public, false otherwise.
   */
  isPublicAddress(address: string): boolean;

  /**
   * Adds a new public address to the wallet.
   */
  addNewAddress(): Promise<string>;

  /**
   * Updates balances of addresses belonging to wallet via RPC service.
   */
  updateBalances(): Promise<Balance[]>;

  /**
   * Initiates transaction to send requested amount to target address
   * and returns promise for transaction id.
   *
   * This only works for wallets supporting multi-address transaction.
   */
  send(toAddress: string, amount: number): Promise<string>;

  /**
   * Initiates transaction to send requested amount from a specific wallet address
   * to target address and returns promise for transaction id.
   *
   * This only works for wallets NOT supporting multi-address transaction.
   */
  sendFrom(from: string, toAddress: string, amount: number): Promise<string>;

  /**
   * Returns web explorer url for this wallet.
   */
  getExporerURL(): string;
}

// tslint:disable-next-line:no-empty-interface
export interface AbstractWallet extends Wallet {}

export abstract class AbstractWallet implements Wallet {
  public readonly code: string;
  public readonly name: string;

  protected readonly kv: SecoKeyval;

  @observable
  protected balances: Balance[] = [];

  constructor(code: string, name: string, kv: SecoKeyval) {
    this.code = code;
    this.name = name;
    this.kv = kv;
  }

  @computed
  public get currentBalances(): ReadonlyArray<Balance> {
    return this.balances;
  }

  @computed
  public get totalBalanceAmount(): number {
    return this.balances.map((b) => b.amount)
      .reduce((prev, current) => prev + current, 0);
  }

  public isPublicAddress(address: string) {
    return true;
  }

  @action
  public async initialize(createEmpty: boolean) {
    await this.initializeImpl(createEmpty);
    this.balances = await this.kv.get(this.code + C.BALANCES_SUFFIX) || [];
    if (this.balances.length === 0) {
      // await?
      this.updateBalances();
    }
  }

  protected abstract initializeImpl(createEmpty: boolean): Promise<any>;

  @action
  public async addNewAddress() {
      const address = await this.addNewAddressImpl();
      runInAction(() => this.balances.push({address, amount: 0}));
      this.kv.set(this.code + C.BALANCES_SUFFIX, this.balances);
      return address;
  }

  protected abstract addNewAddressImpl(): Promise<string>;

  @action
  public updateBalances() {
      const p = this.updateBalancesImpl();
      p.then((balances) => {
          balances = balances || [];
          runInAction(() => this.balances = balances);
          this.kv.set(this.code + C.BALANCES_SUFFIX, balances);
      });
      return p;
  }

  protected abstract updateBalancesImpl(): Promise<Balance[]>;

  public supportsMultiAddress(): boolean {
    return false;
  }

  public send(toAddress: string, amount: number): Promise<string> {
    return Promise.reject("Unsupported");
  }

  public sendFrom(from: string, toAddress: string, amount: number): Promise<string> {
    return Promise.reject("Unsupported");
  }
}
