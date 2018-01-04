import * as bitcoin from "bitcoinjs-lib";
// import typeforce from 'typeforce'
import * as $ from "jquery";
import * as dhttp from "dhttp";
import * as coinselect from "coinselect";

// var fee = 0.00001
const QUERY_URL = "https://api.blocktrail.com/v1/tBTC/address/";
const API_KEY = "a3f9078954c1f4efa062ced312b3ab6bad027ed1";

export class BtcWallet {
  constructor(kv) {
    this.totalBalance = 0;
    this.code = "BTC";
    this.name = "Bitcoin";
    this.keypairs = [];
    this.network = bitcoin.networks.testnet;

    if (!kv) {
      throw new Error("KV is required");
    }
    if (!kv.hasOpened) {
      throw new Error("KV is not ready yet!");
    }
    this.kv = kv;
  }

  updateTotalBalance(callback) {
    this.totalBalance = 0;
    this.readAccounts(() => this.queryAccounts(callback));
  }

  send(toAddress, amount, callback) {
    alert(amount);

    // if(!typeforce(types.Satoshi, amount)) {
    //     alert("error")
    // }

    let that = this;
    let allUnspentOutputs = [];
    let txnId2KeypairMap = new Map();
    let requests = [];
    for (let keypair of this.keypairs) {
      requests.push(new Promise((resolve, reject) => {
        let address = keypair.getAddress();
        that.getUnspentOutputs(address, unspentOutputs => {
          console.log("unspent:" + JSON.stringify(unspentOutputs));
          for (let unspentOutput of unspentOutputs) {
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
      let {
        inputs,
        outputs,
        fee,
      } = coinselect(allUnspentOutputs, [{
        "address": toAddress,
        "value": amount,
      }], 10);

      console.log("Fee: " + fee);

      // .inputs and .outputs will be undefined if no solution was found
      if (!inputs || !outputs) {
        alert("This transaction is not possible.");
        return;
      }

      inputs.forEach(input => console.log("input::" + JSON.stringify(input)));
      outputs.forEach(output => console.log("output::" + JSON.stringify(output)));

      let txb = new bitcoin.TransactionBuilder(this.network);
      for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        txb.addInput(input.txId, input.vout);
      }
      for (let output of outputs) {
        if (!output.address) {
          output.address = that.findChangeAddress(inputs, txnId2KeypairMap);
        }
        txb.addOutput(output.address, output.value);
      }
      for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i];
        txb.sign(i, txnId2KeypairMap.get(input.txId));
      }

      dhttp({
        method: "POST",
        url: "https://testnet-api.smartbit.com.au/v1/blockchain/pushtx",
        json: true,
        body: '{"hex":"' + txb.build().toHex() + '"}',
      }, (err, res) => {
        alert("status code:" + res.statusCode);
        console.log(err);
        console.log(JSON.stringify(res.body));
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
  findChangeAddress(inputs, txnId2KeypairMap) {
    let selectedTxnids = inputs.map(input => input.txId);

    let keypair = this.keypairs.find(key => {
      for (let txnid of selectedTxnids) {
        if (txnId2KeypairMap.get(txnid).getAddress() === key.getAddress()) {
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

  // todo filter unconfirmed ones. see: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/_testnet.js
  getUnspentOutputs(address, callback) {
    let url = QUERY_URL + address + "/unspent-outputs?api_key=" + API_KEY;
    $.get(url, d => {
      callback(d.data.map(it => new UnspentOutput(it.hash, it.index, it.value)));
    });
  }

  readAccounts(callback) {
    if (this.keypairs.length) {
      // already populated
      if (callback) {
        callback();
      }
      return;
    }

    this.kv.get("count").then(count => {
      console.log("Key Count: " + count);
      if (count) {
        let promises = [];
        for (let i = 0; i < count; i++) {
          promises.push(this.kv.get("account" + i));
        }
        Promise.all(promises).then(wifs => {
          wifs.forEach(
            (wif, index) => {
              console.log(index + ": read WIF -> " + wif);
              let keypair = bitcoin.ECPair.fromWIF(wif, this.network);
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

  queryAccounts(callback) {
    if (!callback) {
      alert("Callback required!");
      return;
    }

    if (!this.keypairs.length) {
      alert("Key pairs is empty!");
      return;
    }

    this.keypairs.forEach(
      (keypair, index) => {
        console.log(index + ": querying address -> " + keypair.getAddress());
        if (index === 0) {
          var address = keypair.getAddress();
        }
        this.queryBalance(keypair, () => callback(address, this.totalBalance));
      },
    );
  }

  queryBalance(keypair, doneCallback) {
    let address = keypair.getAddress();
    let url = QUERY_URL + address + "?api_key=" + API_KEY;
    $.get(url, result => {
      let balance = result.balance / 1e8;
      this.totalBalance += balance;
      if (doneCallback) {
        doneCallback();
      }
    });
  }

  generateNewAddress() {
    var keypair = bitcoin.ECPair.makeRandom({
      network: this.network,
    });
    console.log("generated address:" + keypair.getAddress());
    let wif = keypair.toWIF();
    console.log("generated wif:" + wif);
    this.keypairs.push(keypair);
    this.kv.set("count", this.keypairs.length);
    let index = this.keypairs.length - 1;
    this.kv.set("account" + index, wif);
    return keypair;
  }
}

class UnspentOutput {
  constructor(txid, vout, value) {
    this.txId = txid;
    this.vout = vout; // tx index
    this.value = value; // value in satoshi
  }
}
