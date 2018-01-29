const RippleAPI = require("ripple-lib").RippleAPI;
const bip39 = require("bip39");
const rippleKeyPairs = require("ripple-keypairs");
const addressCodec = require("ripple-address-codec");

const serverAddress = "wss://s.altnet.rippletest.net:51233";
//const serverAddress = "wss://s1.ripple.com"

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
            //this.address = rippleAddress.address;
            //this.secret = rippleAddress.secret;
            // comment below to move to real network from testnet
            this.address = "rEayHejjpMadHcmSYzSgXWXdTw1qUTp9mY";
            this.secret = "sn4gGtjVgZGJMqF9nK6kdeo1Bu1XD";
            resolve("success");
        });
        return promise;
    }

    // ADDRESS
    // rEayHejjpMadHcmSYzSgXWXdTw1qUTp9mY
    // SECRET
    // sn4gGtjVgZGJMqF9nK6kdeo1Bu1XD
    // BALANCE
    // 10,000 XRP
    getBalance() {
        const api = new RippleAPI({
            server: serverAddress, // Public test rippled server
        });
        const promise = api.connect().then(() => {
            /* begin custom code ------------------------------------ */
            console.log("getting account info for", this.address);
            return api.getAccountInfo(this.address);
        }).then(info => {
            api.disconnect();
            console.log(info);
            return info.xrpBalance;
        });
        return promise;
    }

    send(toAddr, amount, callback) {
        // todo
    }

}
