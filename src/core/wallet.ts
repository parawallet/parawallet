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
  supportsMultiAddress(): boolean;
  allAddresses(): ReadonlyArray<string>;
  addNewAddress(): Promise<string>;
  totalBalanceAmount(): Promise<number>;
  detailedBalances(): Promise<Balance[]>;
  send(toAddress: string, amount: number): Promise<string>;
  sendFrom(from: string, toAddress: string, amount: number): Promise<string>;
  getExporerURL(): string;
}

// tslint:disable-next-line:no-empty-interface
export interface AbstractWallet extends Wallet {}

export abstract class AbstractWallet implements Wallet {
  public readonly code: string;
  public readonly name: string;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
  }

  public supportsMultiAddress(): boolean {
    return false;
  }

  public totalBalanceAmount(): Promise<number> {
    return this.detailedBalances().then((balances) => {
        let total = 0;
        balances.forEach((balance) => {
            total += balance.amount;
        });
        return total;
    });
  }

  public send(toAddress: string, amount: number): Promise<string> {
    return Promise.reject("Unsupported");
  }

  public sendFrom(from: string, toAddress: string, amount: number): Promise<string> {
    return Promise.reject("Unsupported");
  }
}
