import * as bip39 from "bip39";
import {ECPair, HDNode, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import { SecoKeyval } from "seco-keyval";
import {ChainType, CoinType, generatePath} from "./bip44-path";
import { BtcNetworkType } from "./btc-wallet";

export class BtcAddressGenerator {
    private readonly kv: SecoKeyval;
    private readonly network: Network;
    private readonly cointype: CoinType;
    private readonly mnemonic: string;
    private readonly pass: string;
    private receiveAddressIndex = 0;
    private changeAddressIndex = 0;
    private currentReceiveAddress = "";

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: BtcNetworkType) {
        if (!kv) {
            throw new Error("KV is required");
        }
        if (!kv.hasOpened) {
            throw new Error("KV is not ready yet!");
        }
        if (!mnemonic) {
            throw new Error("no mnemonic");
        }
        this.mnemonic = mnemonic;
        this.kv = kv;
        this.network = networkType === BtcNetworkType.MAINNET ? networks.bitcoin : networks.testnet;
        this.cointype = this.network === networks.bitcoin ? CoinType.BTC : CoinType.TEST;
        this.pass = pass || "";
    }

    public initialize() {
        const promiseList: Array<Promise<any>> = [];
        promiseList.push(
            new Promise((resolve, reject) => {
                    this.kv.get("btc-receive-address-index").then((index) => {
                            if (index) {
                                this.receiveAddressIndex = index;
                                this.currentReceiveAddress = this.prepareAddress(ChainType.EXTERNAL, 0);
                            } else {
                                this.receiveAddressIndex = 0;
                                this.currentReceiveAddress = this.generateReceiveAddress();
                            }
                            resolve("success");
                        },
                    );
                },
            ));
        promiseList.push(
            new Promise((resolve, reject) => {
                this.kv.get("btc-change-address-index").then((index) => {
                            if (index) {
                                this.changeAddressIndex = index;
                            } else {
                                this.changeAddressIndex = 0;
                                this.kv.set("btc-change-address-index", 0);
                            }
                            resolve("success");
                        },
                    );
                },
            ));
        return Promise.all(promiseList);
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

    public getNetwork() {
        return this.network;
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
