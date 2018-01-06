import * as bip39 from "bip39";
import {ECPair, HDNode, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import { SecoKeyval } from "seco-keyval";

export class BtcAddressGenerator {
    private kv: SecoKeyval;
    private receiveAddressIndex = 0;
    private changeAddressIndex = 0;
    private currentReceiveAddress = "";
    private network = networks.testnet;
    private pathPrefix = "m/44'/1'/0'/";
    private mnemonic: string;

    constructor(kv: SecoKeyval) {
        if (!kv) {
            throw new Error("KV is required");
        }
        if (!kv.hasOpened) {
            throw new Error("KV is not ready yet!");
        }
        this.kv = kv;
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
                                that.currentReceiveAddress = that.prepareAddress("receive", 0);
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
        const address = this.prepareAddress("change", this.changeAddressIndex);
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
            keypairs.push(this.getNode("receive", i).keyPair);
        }
        for (let i = 0; i < this.changeAddressIndex; i++) {
            keypairs.push(this.getNode("change", i).keyPair);
        }
        return keypairs;
    }

    public getReceiveAddress() {
        return this.currentReceiveAddress;
    }

    private extractPath(type: string, index: number) {
        let path = this.pathPrefix;
        if (type === "change") {
            path = path + "1/";
        } else {
            path = path + "0/";
        }
        return path + index;
    }

    private getNode(type: string, index: number) {
        const path = this.extractPath(type, index);
        const seed = bip39.mnemonicToSeed(this.mnemonic);
        const root = HDNode.fromSeedBuffer(seed, this.network);
        return root.derivePath(path);
    }

    private prepareAddress(type: string, index: number) {
        return this.getNode(type, index).getAddress();
    }

    private generateReceiveAddress() {
        if (!this.mnemonic) {
            throw new Error("no mnemonic");
        }
        const address = this.prepareAddress("receive", this.receiveAddressIndex);
        this.receiveAddressIndex = this.receiveAddressIndex + 1;
        // TODO: the kv.set methods are async. check if they needs to be synchronized
        this.kv.set("btc-receive-address-index", this.receiveAddressIndex);
        console.log("generated receive address:" + address);
        return address;
    }

}
