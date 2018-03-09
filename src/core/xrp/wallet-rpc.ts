// add "types": "dist/npm/index.d.ts" to package.json in ripple-lib module
import {RippleAPI} from "ripple-lib";
import {generateAddress} from "./address-gen";
import {signWithKeypair} from "./sign";
import {XrpNetworkType} from "./xrp-wallet";

const testServerAddress = "wss://s.altnet.rippletest.net:51233";
const mainServerAddress = "wss://s1.ripple.com";

function serverAddress(networkType: XrpNetworkType) {
    switch (networkType) {
        case XrpNetworkType.MAIN:
            return mainServerAddress;
        default:
            return testServerAddress;
    }
}

export class XrpWalletRpc {
    private readonly mnemonic: string;
    private readonly pass: string;
    private readonly networkType: XrpNetworkType;
    private address = "";
    private publicKey = "";
    private privateKey = "";
    private secret: string;

    constructor(mnemonic: string, pass: string, networkType: XrpNetworkType) {
        this.mnemonic = mnemonic;
        this.pass = pass;
        this.networkType = networkType;
    }

    public initialize() {
        const promise = new Promise((resolve, reject) => {
            const addressAttrs = generateAddress(this.mnemonic, this.pass, 0);
            this.address = addressAttrs.address;
            this.publicKey = addressAttrs.publicKey;
            this.privateKey = addressAttrs.privateKey;

            console.log("XRP ADDRESS-> " + this.address);
            console.log("XRP PUBLIC -> " + this.publicKey);
            console.log("XRP PRIVATE-> " + this.privateKey);

            // from testnet https://ripple.com/build/xrp-test-net/
            // this.address = "rQHiXURDfR62agxA8ykZCJ3PFrky83ALd8";
            // this.secret = "shkXc99SoJhhHJHkL8v79N1YNGWad";

            resolve("success");
        });
        return promise;
    }

    public getBalance() {
        const api = new RippleAPI({
            server: serverAddress(this.networkType),
        });

        return api.connect()
        .then(() => {
            return api.getAccountInfo(this.address);
        }).then((info) => {
            api.disconnect();
            return Number(info.xrpBalance);
        }).catch((e) => {
            api.disconnect();
            console.error(JSON.stringify(e));
            return 0;
        });
    }

    public send(toAddress: string, amount: number) {
        // TODO: explicitly typed as any. see https://github.com/ripple/ripple-lib/issues/866
        const payment: any = this.createPayment(toAddress, String(amount));

        const api = new RippleAPI({
            server: serverAddress(this.networkType),
        });

        const signPromise = api.connect()
            .then(() => api.preparePayment(this.address, payment))
            .then((prepared) => {
                const signedTxn = (this.secret)
                    ? api.sign(prepared.txJSON, this.secret)
                    : signWithKeypair(prepared.txJSON, {privateKey: this.privateKey, publicKey: this.publicKey});
                console.log("ripple txn id:" + signedTxn.id);
                return signedTxn;
            });

        const submitPromise = signPromise
            .then((signedTxn) => api.submit(signedTxn.signedTransaction));

        return Promise.all([signPromise, submitPromise])
            .then((result) => {
                api.disconnect();
                const submitResult = result[1];
                alert(`RESULT: ${JSON.stringify(submitResult)}`);

                const signedTxn = result[0];
                return signedTxn.id;
            }).catch((e) => {
                api.disconnect();
                console.error(JSON.stringify(e));
                return "<invalid-tx>";
            });
    }

    public get publicAddress(): string {
      return this.address;
    }

    private createPayment(toAddress: string, amount: string) {
        const source = {address: this.address, maxAmount: {value: amount, currency: "XRP"}};
        const destination = {address: toAddress, amount: {value: amount, currency: "XRP"}};
        return {source, destination};
    }

}
