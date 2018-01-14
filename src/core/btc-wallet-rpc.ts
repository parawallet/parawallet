import { ECPair, Network } from "bitcoinjs-lib";
import * as request from "request";
import { RequestResponse as Response } from "request";
import { BtcNetworkType } from "./btc-wallet";

export function createBtcWalletRpc(network: BtcNetworkType): IBtcWalletRpc | undefined {
  if (network === BtcNetworkType.MAINNET) {
    throw new Error("not implemented!");
  }
  if (network === BtcNetworkType.TESTNET) {
    return new SmartbitBtcWalletRpc();
  }
}

export interface IBtcWalletRpc {
  queryBalance(addresses: string[]): Promise<Array<[string, number]>>;
  getUnspentOutputs(keyPairs: ECPair[]): Promise<Array<[ECPair, UnspentTxOutput[]]>>;
  pushTransaction(txHex: string): Promise<any>;
}

const unspentTxOutputMinConfirmations = 5;

// https://www.smartbit.com.au/api
class SmartbitBtcWalletRpc implements IBtcWalletRpc {
  private readonly txPushUrl = "https://testnet-api.smartbit.com.au/v1/blockchain/pushtx";
  private readonly queryUrl = "https://testnet-api.smartbit.com.au/v1/blockchain/address/";

  public queryBalance(addresses: string[]) {
    const url = this.queryUrl + addresses.join(",");
    return new Promise<Array<[string, number]>>((resolve, reject) => {
      request.get(url, (error: any, response: Response, body: any) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }

        const balances: Array<[string, number]> = [];
        const results: any[] = JSON.parse(body).addresses;
        results.forEach((result) => {
          console.log("Received query result for " + result.address
            + ", total: " + result.total.balance_int
            + ", confirmed: " + result.confirmed.balance_int
            + ", unconfirmed: " + result.unconfirmed.balance_int);
          balances.push([result.address, result.total.balance_int / 1e8]);
        });

        resolve(balances);
      });
    });
  }

  public getUnspentOutputs(keyPairs: ECPair[]) {
    const url = this.queryUrl + keyPairs.map((keypair) => keypair.getAddress()).join(",") + "/unspent";

    return new Promise<Array<[ECPair, UnspentTxOutput[]]>>((resolve, reject) => {
      request.get(url, (error: any, response: Response, body: any) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }
        // tslint:disable-next-line:interface-over-type-literal
        type utxo = {addresses: string[], txid: string, n: number, value_int: number, confirmations: number};
        const outputs: Array<[ECPair, UnspentTxOutput[]]> = [];

        const result = JSON.parse(body);
        const allUnspents: utxo[] = (result.unspent.filter((out: utxo) => out.confirmations > unspentTxOutputMinConfirmations) as utxo[]);

        keyPairs.forEach((keypair) => {
          const unspents = allUnspents.filter((out) => keypair.getAddress() === out.addresses[0])
            .map((out: utxo) => new UnspentTxOutput(out.txid, out.n, out.value_int));
          outputs.push([keypair, unspents]);
          console.log("Unspent outputs for " + keypair.getAddress() + " -> " + JSON.stringify(unspents));
        });

        resolve(outputs);
      });
    });
  }

  public pushTransaction(txHex: string) {
    return new Promise((resolve, reject) => {
      request.post({
        body: '{"hex":"' + txHex + '"}',
        url: this.txPushUrl,
      }, (error: any, res: Response, body: any) => {
          alert("status code:" + res.statusCode);
          console.log(res.body);
          if (error || res.statusCode !== 200) {
            console.error(error);
            reject(error);
            return;
          }
          resolve("success");
      });
    });
  }
}

// https://insight.bitpay.com/
// https://test-insight.bitpay.com/
// https://github.com/bitpay/insight-api
// we can deploy ourselves, public one has a rate-limiter
class BitpayInsightBtcWalletRpc implements IBtcWalletRpc {
  public queryBalance(addresses: string[]): Promise<Array<[string, number]>> {
    throw new Error("");
  }

  public getUnspentOutputs(keyPairs: ECPair[]): Promise<Array<[ECPair, UnspentTxOutput[]]>> {
    throw new Error("");
  }

  public pushTransaction(txHex: string): Promise<any> {
    throw new Error("");
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
