import { action, runInAction, computed, observable, reaction, toJS } from "mobx";
import SecoKeyval from "seco-keyval";
import * as C from "../constants";

import * as assert from "assert";

export interface Balance {
  readonly address: string;
  readonly amount: number;
}

export type TransactionStatus = "success" | "failure" | "pending";

export type TransactionCompletionCallback = (txid: string, status: string) => void;

export interface Transaction {
  readonly id: string;
  // milliseconds since unix epoch
  readonly timestamp: number;
  readonly source?: string;
  readonly destination: string;
  readonly amount: number;
  status: TransactionStatus;
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
   * Known transactions initiated by this wallet.
   */
  readonly knownTransactions: ReadonlyArray<Transaction>;

  /**
   * Initializes the wallet, either by restoring from database
   * or creating an empty wallet.
   */
  initialize(createEmpty: boolean): Promise<any>;

  /**
   * Returns true if this wallet supports multi-address transactions,
   * false otherwise.
   */
  supportsMultiAddressTransactions(): boolean;

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
   * Initiates transaction to send requested amount
   * to target address and returns promise for transaction id.
   *
   * `fromAddress` is required for wallets NOT supporting multi-address transaction.
   * `fromAddress` is not used used for wallets supporting multi-address transaction.
   */
  send(toAddress: string, amount: number, callback?: TransactionCompletionCallback, fromAddress?: string): Promise<string>;

  /**
   * Returns web explorer url for this wallet.
   */
  getExporerURL(): string;

  /**
   * Validates given address. Fails with an error if address is not valid, returns silently otherwise.
   */
  validateAddress(address: string): void;
}

// tslint:disable-next-line:no-empty-interface
export interface AbstractWallet extends Wallet {}

export abstract class AbstractWallet implements Wallet {
  public readonly code: string;
  public readonly name: string;

  protected readonly kv: SecoKeyval;

  @observable
  protected balances: Balance[] = [];

  @observable
  protected transactions: Transaction[] = [];
  private pendingTransaction: string | null;

  constructor(code: string, name: string, kv: SecoKeyval) {
    this.code = code;
    this.name = name;
    this.kv = kv;

    this.checkPendingTransaction = this.checkPendingTransaction.bind(this);
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

  @computed
  public get knownTransactions(): ReadonlyArray<Transaction> {
    return this.transactions;
  }

  public isPublicAddress(address: string) {
    return true;
  }

  @action
  public async initialize(createEmpty: boolean) {
    await this.initializeImpl(createEmpty);
    this.balances = await this.kv.get(this.code + C.BALANCES_SUFFIX) || [];

    this.transactions = await this.kv.get(this.code + C.TRANSACTIONS_SUFFIX) || [];
    this.trackPendingTransaction();

    reaction(() => this.totalBalanceAmount, () => this.onBalancesChange());
    reaction(() => this.transactions.map((tx) => tx.status), () => this.persistTransactions());

    // https://jsblog.insiderattack.net/timers-immediates-and-process-nexttick-nodejs-event-loop-part-2-2c53fd511bb3
    // https://jsblog.insiderattack.net/promises-next-ticks-and-immediates-nodejs-event-loop-part-3-9226cbe7a6aa
    setImmediate(this.updateBalances.bind(this));
  }

  protected abstract initializeImpl(createEmpty: boolean): Promise<any>;

  private trackPendingTransaction() {
    const pendingTx = this.transactions.find((tx) => tx.status === "pending");
    if (pendingTx) {
      this.pendingTransaction = pendingTx.id;
      setImmediate(this.checkPendingTransaction);
    }
  }

  private schedulePendingTransactionCheck(callback?: TransactionCompletionCallback) {
    setTimeout(this.checkPendingTransaction, 10000, callback);
  }

  private async onBalancesChange() {
    // const prevBalances: Balance[] = await this.kv.get(this.code + C.BALANCES_SUFFIX) || [];
    console.log(`${this.code}: Persisting balances: ${JSON.stringify(this.balances)}`);
    this.kv.set(this.code + C.BALANCES_SUFFIX, toJS(this.balances));

    // TODO: updating transactions is not ready yet!
    // Balances changed, update transactions
    // const balanceMap = new Map(prevBalances.map((balance) => [balance.address, balance.amount] as [string, number]));
    // this.balances.forEach((balance) => {
    //   const amount = balanceMap.get(balance.address);
    //   if (!amount || amount !== balance.amount) {
    //     this.updateTransactions(balance.address);
    //   }
    // });
  }

  // @action
  // private async updateTransactions(address: string) {
  //   let txns = await this.getTransactions(address);
  //   // remove already known transactions
  //   txns = txns.filter((tx) => !this.knownTransactionIds.has(tx.id));
  //   if (txns.length > 0) {
  //     runInAction(() => txns.forEach((tx) => this.transactions.push(tx)));
  //   }
  // }
  //
  // protected abstract getTransactions(address: string): Promise<Transaction[]>;
  //
  // @computed
  // private get knownTransactionIds() {
  //   return new Set(this.transactions.map((tx) => tx.id));
  // }

  private persistTransactions() {
    console.log(`${this.code}: Persisting transactions: ${JSON.stringify(this.transactions)}`);
    this.kv.set(this.code + C.TRANSACTIONS_SUFFIX, toJS(this.transactions));
  }

  @action
  public async addNewAddress() {
      const address = await this.addNewAddressImpl();
      runInAction(() => this.balances.push({address, amount: 0}));
      return address;
  }

  protected abstract addNewAddressImpl(): Promise<string>;

  @action
  public updateBalances() {
      const p = this.updateBalancesImpl();
      p.then((balances) => {
          balances = balances || [];
          runInAction(() => this.balances = balances);
      });
      return p;
  }

  protected abstract updateBalancesImpl(): Promise<Balance[]>;

  public supportsMultiAddressTransactions(): boolean {
    return false;
  }

  public send(toAddress: string, amount: number, callback?: TransactionCompletionCallback, fromAddress?: string): Promise<string> {
    if (this.pendingTransaction) {
      return Promise.reject(`Cannot initiate a new transaction before transaction[${this.pendingTransaction}] finalizes.`);
    }
    if (this.supportsMultiAddressTransactions() && fromAddress) {
      return Promise.reject("This wallet doesn't support explicit 'fromAddress'");
    }
    if (!this.supportsMultiAddressTransactions() && !fromAddress) {
      return Promise.reject("This wallet requires explicit 'fromAddress'");
    }

    const p = this.sendImpl(toAddress, amount, fromAddress);
    p.then((txid) => {
      runInAction(() => this.transactions.push({id: txid, timestamp: Date.now(), source: fromAddress, destination: toAddress, amount, status: "pending"}));
      this.pendingTransaction = txid;
      this.schedulePendingTransactionCheck(callback);
    });

    return p;
  }

  protected abstract sendImpl(toAddress: string, amount: number, fromAddress?: string): Promise<string>;

  private async checkPendingTransaction(callback?: TransactionCompletionCallback) {
    if (!this.pendingTransaction) {
      console.log(this.code + ": No pending transaction at the moment.");
      return;
    }

    console.log(`${this.code}: Checking pending transaction: ${this.pendingTransaction}`);
    const status = await this.transactionStatus(this.pendingTransaction);

    if (status === "pending") {
      this.schedulePendingTransactionCheck(callback);
    } else {
      const tx = this.transactions[this.transactions.length - 1];
      assert.strictEqual(tx.id, this.pendingTransaction);

      tx.status = status;
      console.log(`${this.code}: Completed transaction: ${JSON.stringify(tx)}`);

      this.pendingTransaction = null;
      this.updateBalances();
      if (callback) {
        callback(tx.id, status);
      }
    }
  }

  protected abstract transactionStatus(txid: string): Promise<TransactionStatus>;

}
