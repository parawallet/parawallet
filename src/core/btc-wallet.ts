import {ECPair, Network, networks, TransactionBuilder} from "bitcoinjs-lib";
import coinselect = require("coinselect");
import * as request from "request";
import {RequestResponse as Response} from "request";
import {SecoKeyval} from "seco-keyval";
// import typeforce from 'typeforce'
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";


// var fee = 0.00001
const TX_PUSH_URL = "https://testnet-api.smartbit.com.au/v1/blockchain/pushtx";
const QUERY_URL = "https://api.blocktrail.com/v1/tBTC/address/";
const API_KEY = "a3f9078954c1f4efa062ced312b3ab6bad027ed1";

export class BtcWallet extends AbstractWallet implements IWallet {
  private kv: SecoKeyval;
  private network: Network;
  private keypairs: ECPair[];

  constructor(kv: SecoKeyval) {
    super("BTC", "Bitcoin");
    this.keypairs = [];
    this.network = networks.testnet;

    if (!kv) {
      throw new Error("KV is required");
    }
    if (!kv.hasOpened) {
      throw new Error("KV is not ready yet!");
    }
    this.kv = kv;
  }

  public updateTotalBalance(callback?: BalanceCallback) {
    this.totalBalance = 0;
    this.readAccounts(() => this.queryAccounts(callback));
  }

  public send(toAddress: string, amount: number, callback?: BalanceCallback) {
    alert(amount);

    // if(!typeforce(types.Satoshi, amount)) {
    //     alert("error")
    // }

    const that = this;
    const txnId2KeypairMap = new Map<string, ECPair>();
    const requests: Array<Promise<any>> = [];
    let allUnspentOutputs: UnspentTxOutput[] = [];

    for (const keypair of this.keypairs) {
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

    setTimeout(console.log, 3000, requests);
    Promise.all(requests).then((values) => {
      const {inputs, outputs, fee} = coinselect(allUnspentOutputs, [{"address": toAddress, "value": amount}], 100);

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
          output.address = that.findChangeAddress(inputs, txnId2KeypairMap);
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

            that.updateTotalBalance(callback);
            // if `content-type` was not supported, expect body to be `null` (unless an override is given).
            console.log(res.body);
            // => { foo: 'bar' }, a parsed JSON object
            // ...
        });
    });
  }

  // internal functions

  // finds an address that was not selected by coinselect so it can be used as change address
  private findChangeAddress(inputs: UnspentTxOutput[], txnId2KeypairMap: Map<string, ECPair>) {
    const selectedTxnids = inputs.map((input) => input.txId);

    let keypair = this.keypairs.find((key) => {
      for (const txnid of selectedTxnids) {
        if (txnId2KeypairMap.get(txnid)!.getAddress() === key.getAddress()) {
          return false;
        }
      }
      return true;
    });

    if (!keypair) {
      keypair = this.generateNewAddress();
    }

    console.log("selected addr:" + keypair.toWIF());
    return keypair.getAddress();
  }

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

  private readAccounts(callback?: () => void) {
    if (this.keypairs.length) {
      // already populated
      if (callback) {
        callback();
      }
      return;
    }

    this.kv.get("count").then((count: number) => {
      console.log("Key Count: " + count);
      if (count) {
        const promises: Array<Promise<any>> = [];
        for (let i = 0; i < count; i++) {
          promises.push(this.kv.get("account" + i));
        }
        Promise.all(promises).then((wifs: string[]) => {
          wifs.forEach(
            (wif, index) => {
              console.log(index + ": read WIF -> " + wif);
              const keypair = ECPair.fromWIF(wif, this.network);
              console.log(index + ": read address -> " + keypair.getAddress());
              this.keypairs.push(keypair);
            },
          );
          if (callback) {
            callback();
          }
        });
      } else {
        this.generateNewAddress();
        if (callback) {
          callback();
        }
      }
    });
  }

  private queryAccounts(callback?: BalanceCallback) {
    if (!callback) {
      alert("Callback required!");
      return;
    }

    if (!this.keypairs.length) {
      alert("Key pairs is empty!");
      return;
    }

    let address: string;
    this.keypairs.forEach(
      (keypair, index) => {
        console.log(index + ": querying address -> " + keypair.getAddress());
        if (index === 0) {
          address = keypair.getAddress();
        }
        this.queryBalance(keypair, () => callback(address, this.totalBalance));
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

  private generateNewAddress() {
    const keypair = ECPair.makeRandom({
      network: this.network,
    });
    console.log("generated address:" + keypair.getAddress());
    const wif = keypair.toWIF();
    console.log("generated wif:" + wif);
    this.keypairs.push(keypair);
    this.kv.set("count", this.keypairs.length);
    const index = this.keypairs.length - 1;
    this.kv.set("account" + index, wif);
    return keypair;
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
