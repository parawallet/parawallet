import {ECPair, TransactionBuilder} from "bitcoinjs-lib";
import coinselect = require("coinselect");
import SecoKeyval from "seco-keyval";
import {BtcAddressGenerator} from "./address-gen";
import {createBtcWalletRpc, IBtcWalletRpc, UnspentTxOutput} from "./wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "../wallet";

export enum BtcNetworkType {
    MAINNET, TESTNET,
}

export class BtcWallet extends AbstractWallet implements IWallet {
    private readonly rpc: IBtcWalletRpc;
    private readonly addressGen: BtcAddressGenerator;
    private readonly networkType: BtcNetworkType;

    constructor(kv: SecoKeyval, mnemonic: string, mnemonicPass: string, networkType: BtcNetworkType) {
        super("BTC", "Bitcoin");
        this.networkType = networkType;
        this.rpc = createBtcWalletRpc(networkType);
        this.addressGen = new BtcAddressGenerator(kv, mnemonic, mnemonicPass, networkType, this.rpc.queryTransactions.bind(this.rpc));
    }

    public initialize(createEmpty: boolean) {
        return this.addressGen.initialize(createEmpty);
    }

    public update(callback?: BalanceCallback) {
        const addresses = this.addressGen.getKeypairs().map((keypair) => keypair.getAddress());
        this.rpc.queryBalance(addresses).then((balances) => {
            let total = 0;
            balances.forEach((balance) => {
                const address = balance[0];
                const value = balance[1];
                total += value;
            });
            this.totalBalance = total;
            if (callback) {
                callback(this.addressGen.getReceiveAddress(), this.totalBalance);
            }
        });
    }

    public send(toAddress: string, amount: number) {
        alert("You are about to send " + amount + " bitcoins to " + toAddress);

        const satoshiAmount = amount * 1e8;

        const txnP = this.rpc.getUnspentOutputs(this.addressGen.getKeypairs())
            .then((outputTuples) => this.createTransaction(toAddress, satoshiAmount, outputTuples));

        return txnP.then((txnHex) => this.rpc.pushTransaction(txnHex)).catch((e) => e);
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
}
