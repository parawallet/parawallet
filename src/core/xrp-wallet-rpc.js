const RippleAPI = require("ripple-lib").RippleAPI;

export class XrpWalletRpc {
    constructor() {
        this.address = "";
        this.secret = "";
    }

    initialize() {
        const promise = new Promise((resolve, reject) => {
            const api = new RippleAPI();
            this.address = api.generateAddress().address;
            this.secret = api.generateAddress().secret;
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
