export interface Balance {
  readonly address: string;
  readonly amount: number;
}

export interface WalletType {
  readonly code: string;
  readonly name: string;
}

export interface Wallet extends WalletType {
  initialize(createEmpty: boolean): Promise<any>;
  addresses(): string[];
  totalBalance(): Promise<number>;
  detailedBalance(): Promise<Balance[]>;
  send(toAddress: string, amount: number): Promise<string>;
  getExporerURL(): string;
}

export abstract class AbstractWallet /*implements IWallet*/ {
  public readonly code: string;
  public readonly name: string;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
  }
}
