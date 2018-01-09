import { ECPair, Network } from "bitcoinjs-lib";
import * as request from "request";
import { RequestResponse as Response } from "request";

export interface IBtcWalletRpc {
  queryBalance(address: string): Promise<number>;
  getUnspentOutputs(keyPair: ECPair): Promise<[ECPair, UnspentTxOutput[]]>;
  pushTransaction(txHex: string): Promise<any>;
}

export class BtcWalletTestnetRpc implements IBtcWalletRpc {
  private readonly txPushUrl = "https://testnet-api.smartbit.com.au/v1/blockchain/pushtx";
  private readonly queryUrl = "https://api.blocktrail.com/v1/tBTC/address/";
  private readonly apiKey = "a3f9078954c1f4efa062ced312b3ab6bad027ed1";

  public queryBalance(address: string) {
    const url = this.queryUrl + address + "?api_key=" + this.apiKey;
    return new Promise<number>((resolve, reject) => {
      request.get(url, (error: any, response: Response, body: any) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }

        const result = JSON.parse(body);
        const balance = result.balance / 1e8;
        resolve(balance);
      });
    });
  }

  // todo filter unconfirmed ones.
  // see: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/_testnet.js
  public getUnspentOutputs(keyPair: ECPair) {
    const url = this.queryUrl + keyPair.getAddress() + "/unspent-outputs?api_key=" + this.apiKey;
    return new Promise<[ECPair, UnspentTxOutput[]]>((resolve, reject) => {
      request.get(url, (error: any, response: Response, body: any) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }
        const result = JSON.parse(body);
        const unspent = result.data.map((out: {hash: string, index: number, value: number}) =>
          new UnspentTxOutput(out.hash, out.index, out.value));
        resolve([keyPair, unspent]);
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
