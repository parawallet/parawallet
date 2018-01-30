declare module "seco-keyval" {
    class SecoKeyval {
        hasOpened: boolean;

        constructor(path: string, header: {appName: string, appVersion: string});

        open (passphrase: string, initalData?: {}): Promise<any>;

        set (key: string, value: any): Promise<any>;

        get (key: string): Promise<any>;
    }
    export default SecoKeyval;
}

declare module "coinselect" {

    function coinSelect(utxos: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], feeRate: number): { inputs: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], fee: number };

    export = coinSelect;
}