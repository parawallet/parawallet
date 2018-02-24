export type BalanceCallback = (address: string, balance: number) => void;

export interface IWalletType {
  readonly code: string;
  readonly name: string;
}

export interface IWallet extends IWalletType {
  initialize(newWallet: boolean): Promise<any>;
  getTotalBalance(): number;
  update(callback?: BalanceCallback): void;
  send(toAddress: string, amount: number, callback?: any): void;
}

export abstract class AbstractWallet /*implements IWallet*/ {
  public readonly code: string;
  public readonly name: string;
  protected totalBalance: number;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
    this.totalBalance = 0;
  }

  public getTotalBalance() {
    return this.totalBalance;
  }
}
