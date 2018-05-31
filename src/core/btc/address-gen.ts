import * as bip39 from "bip39";
import {ECPair, HDNode, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import SecoKeyval from "seco-keyval";
import * as C from "../../constants";
import {ChainType, CoinType, generatePath} from "../bip44-path";
import { BtcNetworkType } from "./btc-wallet";
import { QueryTransactionIdsFunc } from "./wallet-rpc";
import { micros } from "../../util/time";
import { stringifyErrorReplacer } from "../../util/errors";
import { loggers } from "../../util/logger";

class Params {
    public readonly receiveAddressIndex: number;
    public readonly changeAddressIndex: number;

    constructor(receiveAddressIndex: number, changeAddressIndex: number) {
        this.receiveAddressIndex = receiveAddressIndex;
        this.changeAddressIndex = changeAddressIndex;
    }
}

export class BtcAddressGenerator {
    private readonly logger = loggers.getLogger("BtcAddressGenerator");
    private readonly kv: SecoKeyval;
    private readonly network: Network;
    private readonly cointype: CoinType;
    private readonly mnemonic: string;
    private readonly pass: string;
    private readonly queryTxFunc: QueryTransactionIdsFunc;
    private readonly keypairs: ECPair[] = [];
    private readonly publicAddressSet = new Set<string>();
    private params: Params = new Params(0, 0);

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: BtcNetworkType, queryTxFunc: QueryTransactionIdsFunc) {
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
            this.fillKeypairs();
            return this.persistParams();
        }

        const params: Params = await this.kv.get(C.BTC_PARAMS);
        this.logger.debug("Params: " + JSON.stringify(params));

        if (params) {
            this.params = params;
            this.fillKeypairs();
        } else {
            const receiveP = this.discover(ChainType.EXTERNAL);
            const changeP = this.discover(ChainType.CHANGE);
            const [receiveIndex, changeIndex] = await Promise.all([receiveP, changeP]);

            this.logger.debug("External address index: " + receiveIndex + ", Change address index: " + changeIndex);
            this.params = new Params(receiveIndex, changeIndex);
            this.fillKeypairs();
            return this.persistParams();
        }
    }

    public get allAddresses() {
        return this.keypairs.map((keypair) => keypair.getAddress());
    }

    public get publicAddresses() {
        return this.publicAddressSet;
    }

    public async addNewReceiveAddress(): Promise<string> {
        const index = this.receiveAddressIndex++;
        await this.persistParams();
        const keypair = this.getKeypair(ChainType.EXTERNAL, index);
        this.logger.debug(`Generated receive address[${index}]: ${keypair.getAddress()}`);
        this.keypairs.push(keypair);
        this.publicAddressSet.add(keypair.getAddress());
        return keypair.getAddress();
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
            const address = this.getAddress(ChainType.CHANGE, i);
            if (!set.has(address)) {
                return address;
            }
        }

        return this.generateChangeAddress();
    }

    public getNetwork() {
        return this.network;
    }

    private async discover(chainType: ChainType): Promise<number> {
        this.logger.debug("Discovering addresses for chain: " + chainType);
        try {
            return await this.discoverTransactions(chainType, 0, 0);
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer));
            return 0;
        }
    }

    private async discoverTransactions(chainType: ChainType, index: number, gap: number): Promise<number> {
        const address = this.getAddress(chainType, index);
        const txIds = await this.queryTxFunc(address);

        if (!txIds || txIds.length === 0) {
            gap++;
            this.logger.debug(`${chainType}: ${index} -> ${address} has NO transactions. gap: ${gap}`);
        } else {
            this.logger.debug(`${chainType}: ${index} -> ${address} has transactions.`);
            gap = 0;
        }
        if (gap < C.GAP_LIMIT) {
            return this.discoverTransactions(chainType, index + 1, gap);
        } else {
            return Math.max(0, index - gap);
        }
    }

    private getNode(type: ChainType, index: number) {
        const path = generatePath(this.cointype, type, index);
        const seed = bip39.mnemonicToSeed(this.mnemonic, this.pass);
        const root = HDNode.fromSeedBuffer(seed, this.network);
        return root.derivePath(path);
    }

    private getKeypair(type: ChainType, index: number) {
        return this.getNode(type, index).keyPair;
    }

    private getAddress(type: ChainType, index: number) {
        return this.getNode(type, index).getAddress();
    }

    public get allKeypairs() {
        return this.keypairs;
    }

    private fillKeypairs() {
        for (let i = 0; i <= this.receiveAddressIndex; i++) {
            const keypair = this.getKeypair(ChainType.EXTERNAL, i);
            this.keypairs.push(keypair);
            this.publicAddressSet.add(keypair.getAddress());
        }
        this.logger.debug(`Generated ${this.receiveAddressIndex + 1} receive addresses.`);

        for (let i = 0; i <= this.changeAddressIndex; i++) {
            const keypair = this.getKeypair(ChainType.CHANGE, i);
            this.keypairs.push(keypair);
        }
        this.logger.debug(`Generated ${this.changeAddressIndex + 1} change addresses.`);
    }

    private generateChangeAddress() {
        const index = this.changeAddressIndex++;

        this.persistParams();

        const keypair = this.getKeypair(ChainType.CHANGE, index);
        this.logger.debug("Generated change address:" + keypair.getAddress());
        this.keypairs.push(keypair);
        return keypair.getAddress();
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
