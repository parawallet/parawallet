import {ECPair, TransactionBuilder} from "bitcoinjs-lib";
import coinselect = require("coinselect");
import {BtcAddressGenerator} from "./btc-address-gen";
import {IBtcWalletRpc, UnspentTxOutput} from "./btc-wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";


export class BtcWallet extends AbstractWallet implements IWallet {
    private rpc: IBtcWalletRpc;
    private addressGen: BtcAddressGenerator;

    constructor(addressGen: BtcAddressGenerator, rpc: IBtcWalletRpc) {
        super("BTC", "Bitcoin");
        this.addressGen = addressGen;
        this.rpc = rpc;
    }

    public update(callback?: BalanceCallback) {
        const promises: Array<Promise<number>> = [];
        this.addressGen.getKeypairs().forEach(
            (keypair, index) => {
                console.log(index + ": querying address -> " + keypair.getAddress());
                promises.push(this.rpc.queryBalance(keypair.getAddress()));
            },
        );
        Promise.all(promises).then((balances) => {
            let total = 0;
            balances.forEach((value) => {
                total += value;
            });
            this.totalBalance = total;
            if (callback) {
                callback(this.addressGen.getReceiveAddress(), this.totalBalance);
            }
        });
    }

    public send(toAddress: string, amount: number, callback?: BalanceCallback) {
        alert("You are about to send " + amount + " bitcoins");

        const satoshiAmount = amount * 1e8;
        const requests: Array<Promise<[ECPair, UnspentTxOutput[]]>> = [];
        this.addressGen.getKeypairs()
            .forEach((keypair) => requests.push(this.rpc.getUnspentOutputs(keypair)));

        const txnId2KeypairMap = new Map<string, ECPair>();
        let allUnspentOutputs: UnspentTxOutput[] = [];

        Promise.all(requests).then((values) => {
            values.forEach((tupple) => {
                const keypair = tupple[0];
                const unspentOutputs = tupple[1];
                unspentOutputs.forEach((output) => txnId2KeypairMap.set(output.txId, keypair));
                allUnspentOutputs = allUnspentOutputs.concat(unspentOutputs);
            });

            const {inputs, outputs, fee} = coinselect(allUnspentOutputs, [{"address": toAddress, "value": satoshiAmount}], 20);
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
            for (const output of outputs) {
                if (!output.address) {
                    output.address = this.addressGen.generateChangeAddress();
                }
                txb.addOutput(output.address, output.value);
            }
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const keypair = txnId2KeypairMap.get(input.txId)!;
                txb.sign(i, keypair);
            }

            this.rpc.pushTransaction(txb.build().toHex())
                .then(() => this.update(callback));
        });
    }
}
