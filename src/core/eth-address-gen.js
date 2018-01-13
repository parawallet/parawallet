import * as bip39 from "bip39";
import {SecoKeyval} from "seco-keyval";
import {ChainType, CoinType, generatePath} from "./bip44-path";

var ethers = require("ethers");
var Wallet = ethers.Wallet;
var utils = ethers.utils;

// todo support multiple addresses
export class EthAddressGenerator {
    constructor(kv, pass) {
        if (!kv) {
            throw new Error("KV is required");
        }
        if (!kv.hasOpened) {
            throw new Error("KV is not ready yet!");
        }
        this.coinType = CoinType.ETH;
        this.kv = kv;
        this.pass = pass || "";
        this.receiveAddress = "";
    }

    initialize() {
        const that = this;
        const promise = new Promise((resolve, reject) => {
            that.kv.get("mnemonic").then((mnemonic) => {
                if (!mnemonic) {
                    throw new Error("no mnemonic");
                } else {
                    console.log("read mnemonic:" + mnemonic);
                    if (!bip39.validateMnemonic(mnemonic)) {
                        alert("Invalid mnemonic!");
                    }
                    that.mnemonic = mnemonic;
                    // todo this library does not support encrytping mnemonic with password
                    that.wallet = Wallet.fromMnemonic(that.mnemonic, generatePath(this.coinType, ChainType.EXTERNAL, 0));
                    that.receiveAddress = that.wallet.address;
                    let providers = ethers.providers;
                    var network = providers.networks.rinkeby;
                    that.provider = new providers.EtherscanProvider(network);
                    that.wallet.provider = that.provider;
                    resolve("success");
                }
            });
        });
        return promise;
    }

    getBalance() {
        return this.provider.getBalance(this.receiveAddress);
    }

    send(toAddr, etherAmount, callback) {
        // todo check if we need to do something related to big numbers
        var options = {
            gasLimit: 30000,
            gasPrice: utils.bigNumberify("20000000000"),
        };
        var amount = etherAmount * 1e18;
        var sendPromise = this.wallet.send(toAddr, amount, options);
        sendPromise.then(function(transactionHash) {
            console.log(transactionHash);
            callback();
        });
        // todo return the receipt, tx hash etc
    }

}
