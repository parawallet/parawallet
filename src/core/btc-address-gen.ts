import * as bip39 from "bip39";
import {ECPair, HDNode, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import { SecoKeyval } from "seco-keyval";
import {ChainType, CoinType, generatePath} from "./bip44-path";

export class BtcAddressGenerator {
    private readonly kv: SecoKeyval;
    private readonly network = networks.testnet;
    private readonly cointype = this.network === networks.bitcoin ? CoinType.BTC : CoinType.TEST;
    private readonly pass: string;
    private receiveAddressIndex = 0;
    private changeAddressIndex = 0;
    private currentReceiveAddress = "";
    private mnemonic: string;

    constructor(kv: SecoKeyval, pass: string) {
        if (!kv) {
            throw new Error("KV is required");
        }
        if (!kv.hasOpened) {
            throw new Error("KV is not ready yet!");
        }
        this.kv = kv;
        this.pass = pass;
    }

    public initialize() {
        const that = this;
        const promiseList: Array<Promise<any>> = [];

        promiseList.push(
            new Promise((resolve, reject) => {
                    that.kv.get("mnemonic").then((mnemonic) => {
                            if (!mnemonic) {
                                mnemonic = bip39.generateMnemonic();
                                that.kv.set("mnemonic", mnemonic);
                                that.mnemonic = mnemonic;
                                console.log("generated mnemonic:" + mnemonic);
                                alert("Please write down following words to backup your wallet: " + mnemonic);
                            } else {
                                console.log("read mnemonic:" + mnemonic);
                                if (!bip39.validateMnemonic(mnemonic)) {
                                    alert("Invalid mnemonic!");
                                }
                                that.mnemonic = mnemonic;
                            }
                            resolve("success");
                        },
                    );
                },
            ));

        promiseList.push(
            new Promise((resolve, reject) => {
                    that.kv.get("btc-receive-address-index").then((index) => {
                            if (index) {
                                that.receiveAddressIndex = index;
                                that.currentReceiveAddress = that.prepareAddress(ChainType.EXTERNAL, 0);
                            } else {
                                that.receiveAddressIndex = 0;
                                that.currentReceiveAddress = that.generateReceiveAddress();
                            }
                            resolve("success");
                        },
                    );
                },
            ));
        promiseList.push(
            new Promise((resolve, reject) => {
                    that.kv.get("btc-change-address-index").then((index) => {
                            if (index) {
                                that.changeAddressIndex = index;
                            } else {
                                that.changeAddressIndex = 0;
                                that.kv.set("btc-change-address-index", 0);
                            }
                            resolve("success");
                        },
                    );
                },
            ));
        return promiseList;
    }

    public generateChangeAddress() {
        if (!this.mnemonic) {
            throw new Error("no mnemonic");
        }
        const address = this.prepareAddress(ChainType.CHANGE, this.changeAddressIndex);
        this.changeAddressIndex = this.changeAddressIndex + 1;
        // TODO: the kv.set methods are async. check if they needs to be synchronized
        this.kv.set("btc-change-address-index", this.changeAddressIndex);
        console.log("generated change address:" + address);
        return address;
    }

    public getKeypairs() {
        if (!this.mnemonic) {
            throw new Error("no mnemonic");
        }
        const keypairs: ECPair[] = [];
        console.log("receiveAddressIndex: " + this.receiveAddressIndex);
        console.log("changeAddressIndex: " + this.changeAddressIndex);
        for (let i = 0; i < this.receiveAddressIndex; i++) {
            keypairs.push(this.getNode(ChainType.EXTERNAL, i).keyPair);
        }
        for (let i = 0; i < this.changeAddressIndex; i++) {
            keypairs.push(this.getNode(ChainType.CHANGE, i).keyPair);
        }
        return keypairs;
    }

    public getReceiveAddress() {
        return this.currentReceiveAddress;
    }

    private getNode(type: ChainType, index: number) {
        const path = generatePath(this.cointype, type, index);
        const seed = bip39.mnemonicToSeed(this.mnemonic, this.pass);
        const root = HDNode.fromSeedBuffer(seed, this.network);
        return root.derivePath(path);
    }

    private prepareAddress(type: ChainType, index: number) {
        return this.getNode(type, index).getAddress();
    }

    private generateReceiveAddress() {
        if (!this.mnemonic) {
            throw new Error("no mnemonic");
        }
        const address = this.prepareAddress(ChainType.EXTERNAL, this.receiveAddressIndex);
        this.receiveAddressIndex = this.receiveAddressIndex + 1;
        // TODO: the kv.set methods are async. check if they needs to be synchronized
        this.kv.set("btc-receive-address-index", this.receiveAddressIndex);
        console.log("generated receive address:" + address);
        return address;
    }

}
