declare module "seco-keyval" {
    export interface SecoKeyval {
        hasOpened: boolean;

        open (passphrase: string, initalData?: {}): Promise<any>;

        set (key: string, value: any): Promise<any>;

        get (key: string): Promise<any>;
    }
}

declare module "eth-lightwallet" {

    export interface KeyStore {
        getAddresses() : any;
        generateNewAddress(key: string, count: number) : any;
        keyFromPassword(pass: string, cb: any) : string;
    }

    function createVault(opts: any, cb: any) : any;

    export = createVault;
}


declare module "hooked-web3-provider" {
    export class HookedWeb3Provider {
        constructor(props: any);
    }
}


declare module "coinselect" {

    function coinSelect(utxos: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], feeRate: number): { inputs: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], fee: number };

    export = coinSelect;
}
