import * as bip39 from "bip39";
import * as lightwallet from "eth-lightwallet";
import {SecoKeyval} from "seco-keyval";
import {ChainType, CoinType, generatePath} from "./bip44-path";

// TODO: hooked-web3-provider is deprecated, use ethjs-provider-signer instead.
const HookedWeb3Provider = require("hooked-web3-provider");
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
                            seedPhrase: mnemonic }
                        , (err, ks) => {
                            that.keystore = ks;
                            that.keystore.keyFromPassword(that.pass, (err2, pwDerivedKey) => {
                                that.keystore.generateNewAddress(pwDerivedKey, 1);
                                that.receiveAddress = that.keystore.getAddresses()[0];
                                alert("addr:" + that.receiveAddress);
                                // TODO: hooked-web3-provider is deprecated, use ethjs-provider-signer instead.
                                const web3Provider = new HookedWeb3Provider({
                                    host: "https://rinkeby.infura.io/",
                                    transaction_signer: that.keystore });
                                this.web3 = new Web3(web3Provider);
                                resolve("success");
                            });
                        });
                }
            });
        });
        return promise;
    }
}
