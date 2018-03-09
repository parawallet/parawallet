import * as bip39 from "bip39";
import {ECPair, HDNode, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import SecoKeyval from "seco-keyval";
import * as C from "../../constants";
import {ChainType, CoinType, generatePath} from "../bip44-path";
import { BtcNetworkType } from "./btc-wallet";
import { QueryTransactionsFunc } from "./wallet-rpc";

const GAP_LIMIT = 20;

class Params {
    public readonly receiveAddressIndex: number;
    public readonly changeAddressIndex: number;

    constructor(receiveAddressIndex: number, changeAddressIndex: number) {
        this.receiveAddressIndex = receiveAddressIndex;
        this.changeAddressIndex = changeAddressIndex;
    }
}

export class BtcAddressGenerator {
    private readonly kv: SecoKeyval;
    private readonly network: Network;
    private readonly cointype: CoinType;
    private readonly mnemonic: string;
    private readonly pass: string;
    private readonly queryTxFunc: QueryTransactionsFunc;
    private params: Params = new Params(0, 0);
    private currentReceiveAddress = "";

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: BtcNetworkType, queryTxFunc: QueryTransactionsFunc) {
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
        this.queryTxFunc = queryTxFunc;
    }

    public initialize(createEmpty: boolean) {
        if (createEmpty) {
            this.params = new Params(0, 0);
            this.currentReceiveAddress = this.prepareAddress(ChainType.EXTERNAL, 0);
            console.log("Creating new wallet... Current receive address: " + this.currentReceiveAddress);
            return this.persistParams();
        }

        const paramsPromise = this.kv.get(C.BTC_PARAMS);

        const receiveIndexPromise = paramsPromise.then((params) => {
            console.log("BTC PARAMS: " + JSON.stringify(params));
            if (params) {
                this.params = params;
                this.currentReceiveAddress = this.prepareAddress(ChainType.EXTERNAL, this.receiveAddressIndex);
            } else {
                return this.discover(ChainType.EXTERNAL).then((receiveIndex: number) => {
                    console.log("EXTERNAL ADDRESS INDEX: " + receiveIndex);
                    this.receiveAddressIndex = receiveIndex;
                    this.currentReceiveAddress = this.generateReceiveAddress();
                });
            }
        });

        const changeIndexPromise = paramsPromise.then((params) => {
            console.log("BTC PARAMS: " + JSON.stringify(params));
            if (!params) {
                return this.discover(ChainType.CHANGE).then((changeIndex: number) => {
                    console.log("CHANGE ADDRESS INDEX: " + changeIndex);
                    this.changeAddressIndex = changeIndex;
                });
            }
        });

        return Promise.all([receiveIndexPromise, changeIndexPromise])
        .then(() => {
            return this.persistParams();
        });
    }

    public pickChangeAddress(usedAddresses: string[]): string {
        // Since we scan transactions for external and change addresses separately,
        // we shouldn't generate new change addresses more than gap limit
        // when there's a change address that's not included in input of the transaction.
        // Reason is, if at least gap limit number of transactions fail somehow,
        // then we may create empty (without transaction) change addresses more than gap limit.
        // This will cause partial discovery of account when restored from mnemonic initially.
        if (this.changeAddressIndex < GAP_LIMIT) {
            return this.generateChangeAddress();
        }

        const set = new Set(usedAddresses);
        for (let i = 0; i <= this.changeAddressIndex; i++) {
            const address = this.prepareAddress(ChainType.CHANGE, i);
            if (!set.has(address)) {
                return address;
            }
        }

        return this.generateChangeAddress();
    }

    public getKeypairs() {
        if (!this.mnemonic) {
            throw new Error("no mnemonic");
        }
        const keypairs: ECPair[] = [];
        console.log("receiveAddressIndex: " + this.receiveAddressIndex);
        console.log("changeAddressIndex: " + this.changeAddressIndex);
        for (let i = 0; i <= this.receiveAddressIndex; i++) {
            keypairs.push(this.getNode(ChainType.EXTERNAL, i).keyPair);
        }
        for (let i = 0; i <= this.changeAddressIndex; i++) {
            keypairs.push(this.getNode(ChainType.CHANGE, i).keyPair);
        }
        return keypairs;
    }

    public get receiveAddress() {
        return this.currentReceiveAddress;
    }

    public getNetwork() {
        return this.network;
    }

    private discover(chainType: ChainType) {
        console.log("Discovering addresses for chain: " + chainType);
        return new Promise((resolve, reject) => {
            this.discoverTransactions(chainType, 0, 0, resolve, reject);
        });
    }

    private discoverTransactions(chainType: ChainType, index: number, gap: number, resolve: (index: number) => void, reject: () => void) {
        const address = this.prepareAddress(chainType, index);
        this.queryTxFunc(address).then((txIds) => {
            if (!txIds || txIds.length === 0) {
                gap++;
                console.error(chainType + ": " + index + " -> " + address + " has NO transactions. gap: " + gap);
            } else {
                console.error(chainType + ": " + index + " -> " + address + " has transactions.");
                gap = 0;
            }
            if (gap < GAP_LIMIT) {
                this.discoverTransactions(chainType, index + 1, gap, resolve, reject);
            } else {
                resolve(Math.max(0, index - gap));
            }
        }).catch((e) => reject());
    }

    private getNode(type: ChainType, index: number) {
        if (!this.mnemonic) {
            throw new Error("no mnemonic");
        }
        const path = generatePath(this.cointype, type, index);
        const seed = bip39.mnemonicToSeed(this.mnemonic, this.pass);
        const root = HDNode.fromSeedBuffer(seed, this.network);
        return root.derivePath(path);
    }

    private prepareAddress(type: ChainType, index: number) {
        return this.getNode(type, index).getAddress();
    }

    private generateReceiveAddress() {
        const address = this.prepareAddress(ChainType.EXTERNAL, this.receiveAddressIndex);
        console.log("generated receive address:" + address);
        return address;
    }

    private generateChangeAddress() {
        const index = this.changeAddressIndex;
        this.changeAddressIndex = index + 1;

        // TODO: the kv.set methods are async. check if they needs to be synchronized
        this.persistParams();

        const address = this.prepareAddress(ChainType.CHANGE, index);
        console.log("generated change address:" + address);
        return address;
    }

    private get receiveAddressIndex() {
        return this.params.receiveAddressIndex;
    }

    private set receiveAddressIndex(receiveIndex: number) {
        this.params = Object.assign({}, this.params, {receiveAddressIndex: receiveIndex});
    }

    private get changeAddressIndex() {
        return this.params.changeAddressIndex;
    }

    private set changeAddressIndex(changeIndex: number) {
        this.params = Object.assign({}, this.params, {changeAddressIndex: changeIndex});
    }

    private persistParams() {
        return this.kv.set(C.BTC_PARAMS, this.params);
    }
}
