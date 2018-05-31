declare module "seco-keyval" {
    class SecoKeyval {
        hasOpened: boolean;

        constructor(path: string, header: {appName: string, appVersion: string});

        open (passphrase: string, initalData?: {}): Promise<any>;

        set (key: string, value: any): Promise<any>;

        get (key: string): Promise<any>;

        delete (key: string): Promise<any>;

        getAllData(): any;

        setAllData(any): void;
    }
    export default SecoKeyval;
}


declare module "coinselect" {
    function coinSelect(utxos: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], feeRate: number): { inputs: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], fee: number };

    export = coinSelect;
}

declare module "react-confirm-alert" {
    function confirmAlert(options: {
        title: string,
        message: string,
        buttons: Array<{label: string, onClick: () => void}>,
        childrenElement?: () => any,
        willUnmount?: () => void
    });
}
