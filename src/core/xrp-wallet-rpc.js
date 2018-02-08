const RippleAPI = require("ripple-lib").RippleAPI;
const bip39 = require("bip39");
const rippleKeyPairs = require("ripple-keypairs");
const addressCodec = require("ripple-address-codec");

const serverAddress = "wss://s.altnet.rippletest.net:51233";

//const serverAddress = "wss://s1.ripple.com";

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
            // todo comment below for real network. the below is testnet https://ripple.com/build/xrp-test-net/
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
            return api.getAccountInfo(this.address);
        }).then(info => {
            api.disconnect();
            return info.xrpBalance;
        });
        return promise;
    }

    // ADDRESS
    // r9ZjacYdw46w8jUaT4ApPG2sodRokFXzux
    // SECRET
    // sn7DK1JuhzU8MdT6LHmW5AnUePSyU
    // BALANCE
    // 10,000 XRP
    send(toAddr, amount, callback) {
        const toAddress = toAddr;
//        const toAddress = "r9ZjacYdw46w8jUaT4ApPG2sodRokFXzux";
        const payment = {
            "destination": {
                "address": toAddress,
                "amount": {
                    "currency": "XRP",
                    "value": "" + amount,
                },
            },
            "source": {
                "address": this.address,
                "maxAmount": {
                    "currency": "XRP",
                    "value": "" + amount,
                },
            },
        };

        try {
            const api = new RippleAPI({
                server: serverAddress, // Public test rippled server
            });
            const promise = api.connect().then(() => {
                api.preparePayment(this.address, payment).then(prepared => {
                        let signedTxn = api.sign(prepared.txJSON, this.secret);
                        console.log("ripple txn id:" + signedTxn.id);
                        api.submit(signedTxn.signedTransaction)
                            .then(result => {
                                alert(result.resultMessage);
                                callback(signedTxn.id);
                            });
                    },
                );
            });
        } catch (error) {
            console.log(error);
        }

    }

}
