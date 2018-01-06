import {ECPair, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import coinselect = require("coinselect");
import * as request from "request";
import { RequestResponse as Response } from "request";
import { BtcAddressGenerator } from "./btc-address-gen";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";


// var fee = 0.00001
const TX_PUSH_URL = "https://testnet-api.smartbit.com.au/v1/blockchain/pushtx";
const QUERY_URL = "https://api.blocktrail.com/v1/tBTC/address/";
const API_KEY = "a3f9078954c1f4efa062ced312b3ab6bad027ed1";

export class BtcWallet extends AbstractWallet implements IWallet {
  private network: Network;
  private addressGen: BtcAddressGenerator;

  constructor(addressGen: BtcAddressGenerator) {
    super("BTC", "Bitcoin");
    this.addressGen = addressGen;
    this.network = networks.testnet;
  }

  public initialize() {
    return this.addressGen.initialize();
  }

  public update(callback?: BalanceCallback) {
    this.totalBalance = 0;
    this.queryAccounts(callback);
  }

  public send(toAddress: string, amount: number, callback?: BalanceCallback) {
    alert("You are about to send " + amount +  " satoshis");

    const that = this;
    const txnId2KeypairMap = new Map<string, ECPair>();
    const requests: Array<Promise<any>> = [];
    let allUnspentOutputs: UnspentTxOutput[] = [];

    for (const keypair of this.addressGen.getKeypairs()) {
      requests.push(new Promise((resolve, reject) => {
        const address = keypair.getAddress();
        that.getUnspentOutputs(address, (unspentOutputs: UnspentTxOutput[]) => {
          console.log("unspent:" + JSON.stringify(unspentOutputs));
          for (const unspentOutput of unspentOutputs) {
            txnId2KeypairMap.set(unspentOutput.txId, keypair);
          }
          allUnspentOutputs = allUnspentOutputs.concat(unspentOutputs);
          console.log("all unspent:" + JSON.stringify(allUnspentOutputs));
          resolve("success");
        });
      }));
    }

    Promise.all(requests).then((values) => {
      const {inputs, outputs, fee} = coinselect(allUnspentOutputs, [{"address": toAddress, "value": amount}], 20);

      console.log("Fee: " + fee);

      // .inputs and .outputs will be undefined if no solution was found
      if (!inputs || !outputs) {
        alert("This transaction is not possible.");
        return;
      }

      inputs.forEach((input) => console.log("input::" + JSON.stringify(input)));
      outputs.forEach((output) => console.log("output::" + JSON.stringify(output)));

      const txb = new TransactionBuilder(this.network);
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

      request.post({
          body: '{"hex":"' + txb.build().toHex() + '"}',
          url: TX_PUSH_URL,
        }, (err: any, res: Response, body: any) => {
            alert("status code:" + res.statusCode);
            console.log(err);
            console.log(JSON.stringify(body));
            // err is only provided if the connection failed in some way
            // OR if the content body parsing failed in some way
            if (err) { return; }
            if (res.statusCode !== 200) { return; }
            if (res.headers["content-type"] !== "application/json") { return; }

            that.update(callback);
            // if `content-type` was not supported, expect body to be `null` (unless an override is given).
            console.log(res.body);
            // => { foo: 'bar' }, a parsed JSON object
            // ...
        });
    });
  }

  // internal functions

  // todo filter unconfirmed ones.
  // see: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/_testnet.js
  private getUnspentOutputs(address: string, callback: (unspentOutputs: UnspentTxOutput[]) => void) {
    const url = QUERY_URL + address + "/unspent-outputs?api_key=" + API_KEY;
    request.get(url, (error: any, response: Response, body: any) => {
      const result = JSON.parse(body);
      callback(result.data.map((out: {hash: string, index: number, value: number}) =>
        new UnspentTxOutput(out.hash, out.index, out.value)));
    });
  }

  private queryAccounts(callback?: BalanceCallback) {
    if (!callback) {
      alert("Callback required!");
      return;
    }

    this.addressGen.getKeypairs().forEach(
      (keypair, index) => {
        console.log(index + ": querying address -> " + keypair.getAddress());
        this.queryBalance(keypair, () => callback(this.addressGen.getReceiveAddress(), this.totalBalance));
      },
    );
  }

  private queryBalance(keypair: ECPair, doneCallback?: () => void) {
    const address = keypair.getAddress();
    const url = QUERY_URL + address + "?api_key=" + API_KEY;
    request.get(url, (error: any, response: Response, body: any) => {
      const result = JSON.parse(body);
      const balance = result.balance / 1e8;
      this.totalBalance += balance;
      if (doneCallback) {
        doneCallback();
      }
    });
  }
}

class UnspentTxOutput {
  public readonly txId: string;
  public readonly vout: number; // tx index
  public readonly value: number; // value in satoshi

  constructor(txid: string, vout: number, value: number) {
    this.txId = txid;
    this.vout = vout;
    this.value = value;
  }
}
