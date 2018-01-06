export type BalanceCallback = (address: string, balance: number) => void;

export interface IWallet {
  readonly code: string;
  readonly name: string;
  getTotalBalance(): number;
  update(callback?: BalanceCallback): void;
  send(toAddress: string, amount: number, callback?: BalanceCallback): void;
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
