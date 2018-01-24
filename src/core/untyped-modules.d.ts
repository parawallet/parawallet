declare module "seco-keyval" {
    export interface SecoKeyval {
        hasOpened: boolean;

        open (passphrase: string, initalData?: {}): Promise<any>;

        set (key: string, value: any): Promise<any>;

        get (key: string): Promise<any>;
    }
}

declare module "coinselect" {

    function coinSelect(utxos: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], feeRate: number): { inputs: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], fee: number };

    export = coinSelect;
}