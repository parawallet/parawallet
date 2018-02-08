import {ECPair, TransactionBuilder} from "bitcoinjs-lib";
import coinselect = require("coinselect");
import SecoKeyval from "seco-keyval";
import {BtcAddressGenerator} from "./btc-address-gen";
import {createBtcWalletRpc, IBtcWalletRpc, UnspentTxOutput} from "./btc-wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";

export enum BtcNetworkType {
    MAINNET, TESTNET,
}

export class BtcWallet extends AbstractWallet implements IWallet {
    private readonly rpc: IBtcWalletRpc;
    private readonly addressGen: BtcAddressGenerator;

    constructor(kv: SecoKeyval, mnemonic: string, mnemonicPass: string, networkType: BtcNetworkType) {
        super("BTC", "Bitcoin");
        const rpc = createBtcWalletRpc(networkType);
        if (rpc) {
            this.rpc = rpc;
        }
        this.addressGen = new BtcAddressGenerator(kv, mnemonic, mnemonicPass, networkType, this.rpc.queryTransactions.bind(this.rpc));
    }

    public initialize(isNewWallet: boolean) {
        return this.addressGen.initialize(isNewWallet);
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

    public send(toAddress: string, amount: number, callback: any) {
        alert("You are about to send " + amount + " bitcoins to " + toAddress);

        const satoshiAmount = amount * 1e8;

        const txnId2KeypairMap = new Map<string, ECPair>();
        let allUnspentOutputs: UnspentTxOutput[] = [];

        this.rpc.getUnspentOutputs(this.addressGen.getKeypairs()).then((outputTuples) => {
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
                alert("This transaction is not possible.");
                return;
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
            this.rpc.pushTransaction(txb.build().toHex())
                .then((txnId) => {
                    // todo move the static url to network type
                    callback("https://www.blocktrail.com/tBTC/tx/", txnId);
                });
        });
    }
}
