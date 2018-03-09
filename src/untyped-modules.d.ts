declare module "seco-keyval" {
    class SecoKeyval {
        hasOpened: boolean;

        constructor(path: string, header: {appName: string, appVersion: string});

        open (passphrase: string, initalData?: {}): Promise<any>;

        set (key: string, value: any): Promise<any>;

        get (key: string): Promise<any>;

        delete (key: string): Promise<any>;
    }
    export default SecoKeyval;
}

declare module "coinselect" {

    function coinSelect(utxos: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], feeRate: number): { inputs: { txId: string, vout: number, value: number }[], outputs: { address: string, value: number }[], fee: number };

    export = coinSelect;
}

declare module "ripple-keypairs" {

    function sign(messageHex: string, privateKey: string): string;

    function deriveKeypair(seed: string): {privateKey: string, publicKey: string};

    function deriveAddress(publicKey: string): string;

    function deriveNodeAddress(publicKey: string): string;
}

declare module "ripple-binary-codec" {

    function encode(json: any): string;

    function encodeForSigning(json: any): string;

    function encodeForMultisigning(json: any, signer: any): string;

}

declare module "ripple-hashes" {
    function computeBinaryTransactionHash(txBlobHex: string): string;
}
