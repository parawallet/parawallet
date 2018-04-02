import * as bip39 from "bip39";
import {ECPair, HDNode, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import SecoKeyval from "seco-keyval";
import * as C from "../../constants";
import {ChainType, CoinType, generatePath} from "../bip44-path";
import { BtcNetworkType } from "./btc-wallet";
import { QueryTransactionsFunc } from "./wallet-rpc";

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
    private readonly addresses: string[] = [];

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

    public async initialize(createEmpty: boolean) {
        if (createEmpty) {
            this.params = new Params(0, 0);
            this.fillAddresses();
            return this.persistParams();
        }

        const params: Params = await this.kv.get(C.BTC_PARAMS);
        console.log("BTC PARAMS: " + JSON.stringify(params));

        if (params) {
            this.params = params;
            this.fillAddresses();
        } else {
            const receiveP = this.discover(ChainType.EXTERNAL);
            const changeP = this.discover(ChainType.CHANGE);
            const [receiveIndex, changeIndex] = await Promise.all([receiveP, changeP]);

            console.log("BTC EXTERNAL ADDRESS INDEX: " + receiveIndex);
            console.log("BTC CHANGE ADDRESS INDEX: " + changeIndex);
            this.params = new Params(receiveIndex, changeIndex);
            this.fillAddresses();
            return this.persistParams();
        }
    }

    public get allAddresses() {
        return this.addresses;
    }

    public async addNewReceiveAddress(): Promise<string> {
        const index = this.receiveAddressIndex++;
        await this.persistParams();
        const address = this.prepareAddress(ChainType.EXTERNAL, index);
        console.log(`generated receive address[${index}]: ${address}`);
        this.addresses.push(address);
        return address;
    }

    public pickChangeAddress(usedAddresses: string[]): string {
        // Since we scan transactions for external and change addresses separately,
        // we shouldn't generate new change addresses more than gap limit
        // when there's a change address that's not included in input of the transaction.
        // Reason is, if at least gap limit number of transactions fail somehow,
        // then we may create empty (without transaction) change addresses more than gap limit.
        // This will cause partial discovery of account when restored from mnemonic initially.
        if (this.changeAddressIndex < C.GAP_LIMIT) {
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

    public getNetwork() {
        return this.network;
    }

    private async discover(chainType: ChainType): Promise<number> {
        console.log("BTC Discovering addresses for chain: " + chainType);
        try {
            return await this.discoverTransactions(chainType, 0, 0);
        } catch (error) {
            console.error(JSON.stringify(error));
            return 0;
        }
    }

    private async discoverTransactions(chainType: ChainType, index: number, gap: number): Promise<number> {
        const address = this.prepareAddress(chainType, index);
        const txIds = await this.queryTxFunc(address);

        if (!txIds || txIds.length === 0) {
            gap++;
            console.error(`BTC ${chainType}: ${index} -> ${address} has NO transactions. gap: ${gap}`);
        } else {
            console.info(`BTC ${chainType}: ${index} -> ${address} has transactions.`);
            gap = 0;
        }
        if (gap < C.GAP_LIMIT) {
            return this.discoverTransactions(chainType, index + 1, gap);
        } else {
            return Math.max(0, index - gap);
        }
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

    private fillAddresses() {
        for (let i = 0; i <= this.receiveAddressIndex; i++) {
            const address = this.prepareAddress(ChainType.EXTERNAL, i);
            console.log(`generated receive address[${i}]: ${address}`);
            this.addresses.push(address);
        }
        for (let i = 0; i <= this.changeAddressIndex; i++) {
            const address = this.prepareAddress(ChainType.CHANGE, i);
            console.log(`generated change address[${i}]: ${address}`);
            this.addresses.push(address);
        }
    }

    private generateChangeAddress() {
        const index = this.changeAddressIndex++;

        // TODO: the kv.set methods are async. check if they needs to be synchronized
        this.persistParams();

        const address = this.prepareAddress(ChainType.CHANGE, index);
        console.log("generated change address:" + address);
        this.addresses.push(address);
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
