import * as bip39 from "bip39";
import {ECPair, HDNode} from "bitcoinjs-lib";
import {ChainType, CoinType, generatePath} from "../bip44-path";

// tslint:disable-next-line:no-var-requires
const basex = require("base-x");
const B58_DICT = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const XRP_B58_DICT = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";


// See https://github.com/iancoleman/bip39/blob/master/src/js/ripple-util.js
function convertRippleAdrress(address: string): string {
  return basex(XRP_B58_DICT).encode(basex(B58_DICT).decode(address));
}
function convertRipplePrivate(privateKey: string): string {
  return basex(B58_DICT).decode(privateKey).toString("hex").toUpperCase().slice(2, 66);
}

export interface Keypair {
  readonly publicKey: string;
  readonly privateKey: string;
}

export class XrpAccount {
  public readonly address: string;
  public readonly keypair: Keypair | string; // Keypair | secret

  constructor(address: string, keypair: Keypair | string) {
      this.address = address;
      this.keypair = keypair;
  }
}

export function generateAddress(mnemonic: string, pass: string, index: number): XrpAccount {
  const path = generatePath(CoinType.XRP, ChainType.EXTERNAL, index);
  const seed = bip39.mnemonicToSeed(mnemonic, pass);
  const root = HDNode.fromSeedBuffer(seed);
  const node = root.derivePath(path);

  const publicKey = node.getPublicKeyBuffer().toString("hex").toUpperCase();
  const address = convertRippleAdrress(node.getAddress());
  const privateKey = "00" + convertRipplePrivate(node.keyPair.toWIF());

  return new XrpAccount(address, {publicKey, privateKey});
}
