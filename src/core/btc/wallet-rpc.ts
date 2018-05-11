import { ECPair, Network } from "bitcoinjs-lib";
import * as request from "request-promise-native";
import { RequestResponse as Response } from "request";
import { Balance, Transaction } from "../wallet";
import { BtcNetworkType } from "./btc-wallet";
import { stringifyErrorReplacer } from "../../util/errors";

export function createBtcWalletRpc(network: BtcNetworkType): BtcWalletRpc {
    return new SmartbitBtcWalletRpc(network);
}

function notImplemented(): never {
  throw new Error("not implemented!");
}

function illegalArgument(arg: any): never {
  throw new Error("illegal argument: " + arg);
}

export type QueryTransactionIdsFunc = (address: string) => Promise<string[]>;

export interface BtcWalletRpc {
  queryTransactionIds: QueryTransactionIdsFunc;
  queryBalance(addresses: string[]): Promise<Balance[]>;
  getUnspentOutputs(keyPairs: ECPair[]): Promise<Array<[ECPair, UnspentTxOutput[]]>>;
  pushTransaction(txHex: string): Promise<string>;
  getTransaction(txid: string): Promise<any>;
}

const unspentTxOutputMinConfirmations = 5;


// https://en.bitcoin.it/wiki/Transaction_broadcasting
// https://www.smartbit.com.au/api
class SmartbitBtcWalletRpc implements BtcWalletRpc {
  private static readonly TESTNET = "https://testnet-api.smartbit.com.au/v1/blockchain/";
  private static readonly MAINNET = "https://api.smartbit.com.au/v1/blockchain/";

  private readonly baseUrl: string;
  private readonly txPushUrl: string;
  private readonly queryUrl: string;
  private readonly txUrl: string;

  constructor(network: BtcNetworkType) {
    this.baseUrl = network === BtcNetworkType.MAINNET
      ? SmartbitBtcWalletRpc.MAINNET : SmartbitBtcWalletRpc.TESTNET;

    this.txPushUrl = this.baseUrl + "pushtx";
    this.queryUrl = this.baseUrl + "address/";
    this.txUrl = this.baseUrl + "transaction/";
  }

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
          return {address: result.address, amount: result.confirmed.balance_int / 1e8};
      });
    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      return addresses.map((address) => {
        return {address, amount: 0};
      });
    }
  }

  public async queryTransactionIds(address: string): Promise<string[]> {
    const transactions = await this.queryTransactionsImpl(address);
    return transactions.map((tx: any) => tx.txid);
  }

  public async queryTransactions(address: string): Promise<Transaction[]> {
    const transactions = await this.queryTransactionsImpl(address);
    return transactions.map((tx: any) => {
      // tx.confirmation
      // tx.input_amount_int
      // tx.output_amount_int
      // tx.inputs.foreach.addresses[0]

      const inputs: any[] = tx.inputs;
      const outputs: any[] = tx.inputs;

      let isDestination = false;
      tx.outputs.foreach((output: any) => {
        const addresses: string[] = output.addresses;
        isDestination = addresses.indexOf(address) > -1;
      });

       // TODO ???
      const status = "success";
      return {id: tx.txid, timestamp: tx.time, status};
    });
  }

  private async queryTransactionsImpl(address: string): Promise<any> {
    const url = this.queryUrl + address;
    try {
      const body: string = await request.get(url);
      const addressObj = JSON.parse(body).address;
      const transactions: any[] = addressObj.transactions || [];
      return transactions;
    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
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
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      return [];
    }
  }

  public async pushTransaction(txHex: string): Promise<string> {
    const options = {
      body: '{"hex":"' + txHex + '"}',
      url: this.txPushUrl,
    };

    try {
      const body = await request.post(options);
      const txid: string = JSON.parse(body).txid;
      console.log("https://www.blocktrail.com/tBTC/tx/" + txid);
      return txid;
    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      throw error;
    }
  }

  public async getTransaction(txid: string) {
    const url = this.txUrl + txid;
    try {
      const txStr = await request.get(url);
      const tx = JSON.parse(txStr);
      return tx;
    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      return null;
    }
  }
}

// https://blockexplorer.com/api-ref
// https://testnet.blockexplorer.com/

// https://insight.bitpay.com/api
// https://test-insight.bitpay.com/api
// https://github.com/bitpay/insight-api
// we can deploy ourselves, public one has a rate-limiter
class BitpayInsightBtcWalletRpc implements BtcWalletRpc {
  private static readonly TESTNET = "https://test-insight.bitpay.com/api/";
  private static readonly MAINNET = "https://insight.bitpay.com/api/";

  private readonly baseUrl: string;
  private readonly txPushUrl: string;
  private readonly queryAddressUrl: string;
  private readonly balanceSuffix: string;
  private readonly utxoUrl: string;

  constructor(network: BtcNetworkType) {
    this.baseUrl = network === BtcNetworkType.MAINNET
      ? BitpayInsightBtcWalletRpc.MAINNET : BitpayInsightBtcWalletRpc.TESTNET;

    this.txPushUrl = this.baseUrl + "tx/send";
    this.queryAddressUrl = this.baseUrl + "addr/";
    this.balanceSuffix = "/balance";
    this.utxoUrl = this.baseUrl + "addrs/";

  }

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
    const promises = addresses.map((address) => {
      const url = this.queryAddressUrl + address + this.balanceSuffix;
      return request.get(url).then((value) => {
        console.log("Received query result for " + address + ", amount: " + value);
        return {address, amount: Number(value) / 1e8};
      }).catch((error) => {
        console.error(JSON.stringify(error, stringifyErrorReplacer));
        return {address, amount: 0};
      });
    });
    return Promise.all(promises);
  }

  public async queryTransactionIds(address: string): Promise<string[]> {
    const url = this.queryAddressUrl + address;

    try {
      const body: string = await request.get(url);
      const response = JSON.parse(body);
      return response.transactions as string[];

    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      return [];
    }
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

  public async getUnspentOutputs(keyPairs: ECPair[]) {
    const url = this.utxoUrl + keyPairs.map((keypair) => keypair.getAddress()).join(",") + "/utxo";

    try {
      const body: string = await request.get(url);

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
      return outputs;
    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      return [];
    }
  }

  // TODO: fails with HTTP 500 Internal Server Error
  public async pushTransaction(txHex: string): Promise<string> {
    const options = {
      body: '{"rawtx":"' + txHex + '"}',
      url: this.txPushUrl,
    };

    try {
      const body = await request.post(options);
      const txid: string = JSON.parse(body).txid;
      console.log("https://www.blocktrail.com/tBTC/tx/" + txid);
      return txid;
    } catch (error) {
      console.error(JSON.stringify(error, stringifyErrorReplacer));
      throw error;
    }
  }

  public getTransaction(txid: string) {
    return Promise.reject("Not implemented");
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
