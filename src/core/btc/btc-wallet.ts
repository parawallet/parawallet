import {address as btcAddress, ECPair, TransactionBuilder} from "bitcoinjs-lib";
import coinselect = require("coinselect");
import SecoKeyval from "seco-keyval";
import * as C from "../../constants";
import {AbstractWallet, Balance, Wallet, TransactionStatus, Transaction} from "../wallet";
import {BtcAddressGenerator} from "./address-gen";
import {BtcWalletRpc, createBtcWalletRpc, UnspentTxOutput} from "./wallet-rpc";
import { computed, action } from "mobx";

export enum BtcNetworkType {
    MAINNET, TESTNET,
}

export class BtcWallet extends AbstractWallet implements Wallet {
    private readonly rpc: BtcWalletRpc;
    private readonly addressGen: BtcAddressGenerator;
    private readonly networkType: BtcNetworkType;

    constructor(kv: SecoKeyval, mnemonic: string, mnemonicPass: string, networkType: BtcNetworkType) {
        super("BTC", "Bitcoin", kv);
        this.networkType = networkType;
        this.rpc = createBtcWalletRpc(networkType);
        this.addressGen = new BtcAddressGenerator(kv, mnemonic, mnemonicPass, networkType, this.rpc.queryTransactionIds.bind(this.rpc));
        console.info(`BTC using ${BtcNetworkType[networkType]} network`);
    }

    protected initializeImpl(createEmpty: boolean) {
        return this.addressGen.initialize(createEmpty);
    }

    public supportsMultiAddressTransactions(): boolean {
        return true;
    }

    public isPublicAddress(address: string) {
        return this.addressGen.publicAddresses.has(address);
      }

    protected addNewAddressImpl() {
        return this.addressGen.addNewReceiveAddress();
    }

    public updateBalancesImpl() {
        const addresses = this.addressGen.allAddresses;
        // TODO: query balances in smaller batches
        return this.rpc.queryBalance(addresses).then((balances) => {
            const set = new Set(addresses);
            balances = balances || [];
            balances.forEach((b) => {
                set.delete(b.address);
            });
            set.forEach((address) => {
                balances.push({address, amount: 0});
            });
            return balances;
        });
    }

    protected async sendImpl(toAddress: string, amount: number) {
        const satoshiAmount = amount * 1e8;
        const outputTuples = await this.rpc.getUnspentOutputs(this.addressGen.allKeypairs);
        const txnHex = this.createTransaction(toAddress, satoshiAmount, outputTuples);
        return await this.rpc.pushTransaction(txnHex);
    }

    public getExporerURL() {
        return this.networkType === BtcNetworkType.TESTNET ? "https://www.blocktrail.com/tBTC/tx/" : "https://www.blocktrail.com/BTC/tx/";
    }

    private createTransaction(toAddress: string, satoshiAmount: number, outputTuples: Array<[ECPair, UnspentTxOutput[]]>) {
        const txnId2KeypairMap = new Map<string, ECPair>();
        let allUnspentOutputs: UnspentTxOutput[] = [];

        outputTuples.forEach((tupple) => {
            const keypair = tupple[0];
            const unspentOutputs = tupple[1];
            unspentOutputs.forEach((output) => txnId2KeypairMap.set(output.txId, keypair));
            allUnspentOutputs = allUnspentOutputs.concat(unspentOutputs);
        });
        const {inputs, outputs, fee} = coinselect(allUnspentOutputs, [{
            "address": toAddress,
            "value": satoshiAmount,
        }], 20);
        console.log("Fee: " + fee);

        // .inputs and .outputs will be undefined if no solution was found
        if (!inputs || !outputs) {
            throw new Error("This transaction is not possible!");
        }

        inputs.forEach((input) => console.log("input::" + JSON.stringify(input)));
        outputs.forEach((output) => console.log("output::" + JSON.stringify(output)));

        const txb = new TransactionBuilder(this.addressGen.getNetwork());
        for (const input of inputs) {
            txb.addInput(input.txId, input.vout);
        }

        const usedAddresses = Array.from(txnId2KeypairMap.values()).map((key) => key.getAddress());
        for (const output of outputs) {
            if (!output.address) {
                output.address = this.addressGen.pickChangeAddress(usedAddresses);
            }
            txb.addOutput(output.address, output.value);
            usedAddresses.push(output.address);
        }
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const keypair = txnId2KeypairMap.get(input.txId)!;
            txb.sign(i, keypair);
        }
        return txb.build().toHex();
    }

    protected async getTransactions(address: string): Promise<Transaction[]> {
        const result: Transaction[] = [];
        return result;
    }

    protected async transactionStatus(txid: string): Promise<TransactionStatus> {
        let st: TransactionStatus = "pending";
        const tx = await this.rpc.getTransaction(txid);
        console.log(`BTC TX: ${JSON.stringify(tx)}`);
        if (tx.success) {
            st = "success";
        }
        return st;
    }

    public validateAddress(address: string) {
        btcAddress.toOutputScript(address, this.addressGen.getNetwork());
    }
}
