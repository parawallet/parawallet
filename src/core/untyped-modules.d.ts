
declare module "seco-keyval" {
  export interface SecoKeyval {
    hasOpened: boolean;

    open (passphrase: string, initalData?: {}): Promise<any>;
    set (key: string, value: any): Promise<any>;
    get (key: string): Promise<any>;
  }
}

declare module "coinselect" {
  export interface UTXO {
    readonly txId: string;
    readonly vout: number; // tx index
    readonly value: number; // value in satoshi
  }

  export function coinSelect (utxos: UTXO[], outputs: {address: string, value: number}[], feeRate: number):
    {inputs: UTXO[], outputs: {address: string, value: number}[], fee: number};

}
