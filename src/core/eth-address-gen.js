import * as bip39 from "bip39";
import * as lightwallet from "eth-lightwallet";
import {SecoKeyval} from "seco-keyval";
import {ChainType, CoinType, generatePath} from "./bip44-path";

const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs-query');
const Web3 = require("web3");

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
                    lightwallet.keystore.createVault({
                            hdPathString: generatePath(this.coinType, ChainType.EXTERNAL, 0),
                            password: that.pass,
                            seedPhrase: mnemonic,
                        }
                        , (err, ks) => {
                            that.keystore = ks;
                            that.keystore.keyFromPassword(that.pass, (err2, pwDerivedKey) => {
                                that.keystore.generateNewAddress(pwDerivedKey, 1);
                                that.receiveAddress = that.keystore.getAddresses()[0];
                                console.log("eth receive addr:" + that.receiveAddress);
                                // TODO: hooked-web3-provider is deprecated, use ethjs-provider-signer instead.
                                const web3Provider = new HookedWeb3Provider({
                                    host: "https://rinkeby.infura.io/",
                                    transaction_signer: that.keystore,
                                });
                                const provider = new SignerProvider('https://rinkeby.infura.io/', {
                                    signTransaction: (rawTx, cb) => cb(null, sign(rawTx, '0x...privateKey...')),
                                    accounts: (cb) => cb(null, ['0x407d73d8a49eeb85d32cf465507dd71d507100c1']),
                                });
                                this.web3 = new Web3(web3Provider);
                                resolve("success");
                            });
                        });
                }
            });
        });
        return promise;
    }

    getBalance() {
        return this.web3.eth.getBalance(this.receiveAddress);
    }

    send(toAddr, amount, callback) {
        const gas = 50000;
        const gasPrice = 18000000000;
        // todo return the receipt, tx hash etc
        this.web3.eth.sendTransaction({
            from: this.receiveAddress,
            gas: gas,
            gasPrice: gasPrice,
            to: toAddr,
            value: parseFloat(amount) * 1.0e18,
        }, function(err, txhash) {
            alert("huhu");
            callback();
        });
    }

}
