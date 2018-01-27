const RippleAPI = require("ripple-lib").RippleAPI;
const bip39 = require("bip39");
const rippleKeyPairs = require("ripple-keypairs");
const addressCodec = require("ripple-address-codec");

export class XrpWalletRpc {
    constructor(mnemonic) {
        this.mnemonic = mnemonic;
        this.address = "";
        this.secret = "";
    }

    // todo bip39 is implemented but bip32 is missing
    initialize() {
        const promise = new Promise((resolve, reject) => {
            const api = new RippleAPI();
            const entropy = bip39.mnemonicToEntropy(this.mnemonic);
            let buffer = Buffer.from(entropy, "hex");
            let entropyBytes = Array.prototype.slice.call(buffer, 0);
            const rippleAddress = api.generateAddress({"entropy": entropyBytes});
            this.address = rippleAddress.address;
            this.secret = rippleAddress.secret;
            resolve("success");
        });
        return promise;
    }

    getBalance() {
        const promise = new Promise((resolve, reject) => {
            resolve(17);
        });
        return promise;
    }

    send(toAddr, etherAmount, callback) {
        // todo
    }

}
