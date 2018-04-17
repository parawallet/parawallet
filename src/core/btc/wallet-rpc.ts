import { ECPair, Network } from "bitcoinjs-lib";
import * as request from "request-promise-native";
import { RequestResponse as Response } from "request";
import { Balance } from "../wallet";
import { BtcNetworkType } from "./btc-wallet";

export function createBtcWalletRpc(network: BtcNetworkType): BtcWalletRpc {
  if (network === BtcNetworkType.MAINNET) {
    return notImplemented();
  }
  if (network === BtcNetworkType.TESTNET) {
    return new SmartbitBtcWalletRpc();
    // return new BitpayInsightBtcWalletRpc();
  }
  return illegalArgument(network);
}

function notImplemented(): never {
  throw new Error("not implemented!");
}

function illegalArgument(arg: any): never {
  throw new Error("illegal argument: " + arg);
}

export type QueryTransactionsFunc = (address: string) => Promise<string[]>;

export interface BtcWalletRpc {
  queryTransactions: QueryTransactionsFunc;
  queryBalance(addresses: string[]): Promise<Balance[]>;
  getUnspentOutputs(keyPairs: ECPair[]): Promise<Array<[ECPair, UnspentTxOutput[]]>>;
  pushTransaction(txHex: string): Promise<string>;
}

const unspentTxOutputMinConfirmations = 5;


// https://en.bitcoin.it/wiki/Transaction_broadcasting
// https://www.smartbit.com.au/api
class SmartbitBtcWalletRpc implements BtcWalletRpc {
  private readonly baseUrl = "https://testnet-api.smartbit.com.au/v1/blockchain/";
  private readonly txPushUrl = this.baseUrl + "pushtx";
  private readonly queryUrl = this.baseUrl + "address/";

  public async queryBalance(addresses: string[]) {
    const url = this.queryUrl + addresses.join(",");

    try {
      const body: string = await request.get(url);
      const response = JSON.parse(body);
      const results: any[] = response.addresses || [response.address];

      return results.map((result) => {
          console.log("Received query result for " + result.address
          + ", total: " + result.total.balance_int
          + ", confirmed: " + result.confirmed.balance_int
          + ", unconfirmed: " + result.unconfirmed.balance_int);
          return {address: result.address, amount: result.total.balance_int / 1e8};
      });
    } catch (error) {
      console.error(JSON.stringify(error));
      return [];
    }
  }

  public async queryTransactions(address: string): Promise<string[]> {
    const url = this.queryUrl + address;
    try {
      const body: string = await request.get(url);
      const addressObj = JSON.parse(body).address;
      const transactions: any[] = addressObj.transactions || [];
      return transactions.map((tx) => tx.txid);

    } catch (error) {
      console.error(JSON.stringify(error));
      return [];
    }
  }

  public async getUnspentOutputs(keyPairs: ECPair[]) {
    const url = this.queryUrl + keyPairs.map((keypair) => keypair.getAddress()).join(",") + "/unspent";

    try {
      const body = await request.get(url);
      const result = JSON.parse(body);

      const outputs: Array<[ECPair, UnspentTxOutput[]]> = [];

      // tslint:disable-next-line:interface-over-type-literal
      type utxo = {addresses: string[], txid: string, n: number, value_int: number, confirmations: number};
      const allUnspents: utxo[] = (result.unspent.filter((out: utxo) => out.confirmations > unspentTxOutputMinConfirmations) as utxo[]);

      keyPairs.forEach((keypair) => {
        const unspents = allUnspents.filter((out) => keypair.getAddress() === out.addresses[0])
          .map((out: utxo) => new UnspentTxOutput(out.txid, out.n, out.value_int));
        outputs.push([keypair, unspents]);
        console.log("Unspent outputs for " + keypair.getAddress() + " -> " + JSON.stringify(unspents));
      });

      return outputs;

    } catch (error) {
      console.error(JSON.stringify(error));
      return [];
    }
  }

  public async pushTransaction(txHex: string): Promise<string> {
    const options = {
      body: '{"hex":"' + txHex + '"}',
      url: this.txPushUrl,
    };

    const body = await request.post(options);
    const txid: string = JSON.parse(body).txid;
    console.log("https://www.blocktrail.com/tBTC/tx/" + txid);
    return txid;
  }
}

// https://blockexplorer.com/api-ref
// https://testnet.blockexplorer.com/

// https://insight.bitpay.com/api
// https://test-insight.bitpay.com/api
// https://github.com/bitpay/insight-api
// we can deploy ourselves, public one has a rate-limiter
class BitpayInsightBtcWalletRpc implements BtcWalletRpc {
  private readonly baseUrl = "https://test-insight.bitpay.com/api/";
  private readonly txPushUrl = this.baseUrl + "tx/send";
  private readonly queryUrl = this.baseUrl + "addr/";
  private readonly utxoUrl = this.baseUrl + "addrs/";

  // Sample Query Response
  // {
  //   "addrStr": "mghqrkumg9u2CmGjqA2qxRtnMt43jZdWsX",
  //   "balance": 0.989955,
  //   "balanceSat": 98995500,
  //   "totalReceived": 0.989955,
  //   "totalReceivedSat": 98995500,
  //   "totalSent": 0,
  //   "totalSentSat": 0,
  //   "unconfirmedBalance": 0,
  //   "unconfirmedBalanceSat": 0,
  //   "unconfirmedTxApperances": 0,
  //   "txApperances": 1,
  //   "transactions": ["ce566de97628f32f4042953ca0c6e34191a8172fe35c5f5e42d851735036a56d"]
  // }

  public queryBalance(addresses: string[]) {
    const promises: Array<Promise<Balance>> = [];
    addresses.forEach((address) => {
      const url = this.queryUrl + address;
      promises.push(new Promise<Balance>((resolve, reject) => {
        request.get(url, (error: any, response: Response, body: any) => {
          if (error) {
            console.error(error);
            reject(error);
            return;
          }

          const bodyObj = JSON.parse(body);
          console.log("Received query result for " + bodyObj.addrStr
          + ", total: " + bodyObj.balance
          + ", unconfirmed: " + bodyObj.unconfirmedBalance);

          resolve({address, amount: bodyObj.balance});
        });
      }));
    });

    return Promise.all(promises);
  }

  public queryTransactions(address: string): Promise<string[]> {
    const url = this.queryUrl + address;
    return new Promise<string[]>((resolve, reject) => {
      request.get(url, (error: any, response: Response, body: any) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }

        const bodyObj = JSON.parse(body);
        resolve(bodyObj.transactions);
      });
    });
  }

  // Sample UTXO Response
  // [{
  //   "address": "mzT8P1Vgzw8HdX5yS8mwK7UVyb9HFotU6n",
  //   "txid": "a1937b599f49f9d5dcfeec86ddc445819a92b9166ab89ac5e9388fb27306ce45",
  //   "vout": 1,
  //   "scriptPubKey": "76a914cfb1251afe501dc77a9142b16fdb3bbf60e27ce788ac",
  //   "amount": 0.99791,
  //   "satoshis": 99791000,
  //   "height": 1258804,
  //   "confirmations": 464
  // }, {
  //   "address": "mghqrkumg9u2CmGjqA2qxRtnMt43jZdWsX",
  //   "txid": "ce566de97628f32f4042953ca0c6e34191a8172fe35c5f5e42d851735036a56d",
  //   "vout": 1,
  //   "scriptPubKey": "76a9140d07542892903a42b70413f8ce68b36ab2956bbc88ac",
  //   "amount": 0.989955,
  //   "satoshis": 98995500,
  //   "height": 1258081,
  //   "confirmations": 1187
  // }]

  public getUnspentOutputs(keyPairs: ECPair[]) {
    const url = this.utxoUrl + keyPairs.map((keypair) => keypair.getAddress()).join(",") + "/utxo";

    return new Promise<Array<[ECPair, UnspentTxOutput[]]>>((resolve, reject) => {
      request.get(url, (error: any, response: Response, body: any) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }
        // tslint:disable-next-line:interface-over-type-literal
        type utxo = {address: string, txid: string, vout: number, satoshis: number, confirmations: number};
        const outputs: Array<[ECPair, UnspentTxOutput[]]> = [];

        const result = JSON.parse(body);
        const allUnspents: utxo[] = (result.filter((out: utxo) => out.confirmations > unspentTxOutputMinConfirmations) as utxo[]);

        keyPairs.forEach((keypair) => {
          const unspents = allUnspents.filter((out) => keypair.getAddress() === out.address)
            .map((out: utxo) => new UnspentTxOutput(out.txid, out.vout, out.satoshis));
          outputs.push([keypair, unspents]);
          console.log("Unspent outputs for " + keypair.getAddress() + " -> " + JSON.stringify(unspents));
        });

        resolve(outputs);
      });
    });
  }

  // TODO: fails with HTTP 500 Internal Server Error
  public pushTransaction(txHex: string): Promise<string> {
    console.log("Pushing tx: " + txHex);
    return new Promise((resolve, reject) => {
      request.post({
        body: '{rawtx:"' + txHex + '"}',
        url: this.txPushUrl,
      }, (error: any, res: Response, body: any) => {
          if (error || res.statusCode !== 200) {
            console.error(error);
            reject(error);
            return;
          }
          alert("transaction completed successfully");
          resolve("success");
      });
    });
  }
}

export class UnspentTxOutput {
  public readonly txId: string;
  public readonly vout: number; // tx index
  public readonly value: number; // value in satoshi

  constructor(txid: string, vout: number, value: number) {
    this.txId = txid;
    this.vout = vout;
    this.value = value;
  }
}
