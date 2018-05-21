import SecoKeyval from "seco-keyval";
import {remote} from "electron";
import { isProductionBuild } from "../runtime-args";
import {BtcNetworkType, BtcWallet} from "../core/btc/btc-wallet";
import {EthNetworkType, EthWallet} from "../core/eth/eth-wallet";
import {Balance, Wallet, WalletType} from "../core/wallet";
import {XrpNetworkType, XrpWallet} from "../core/xrp/xrp-wallet";

const production = isProductionBuild(remote.process);
const btcNetworkType = production ? BtcNetworkType.MAINNET : BtcNetworkType.TESTNET;
const ethNetworkType = production ? EthNetworkType.mainnet : EthNetworkType.rinkeby;
const xrpNetworkType = production ? XrpNetworkType.MAIN : XrpNetworkType.TEST;

export function newBtcWallet(kv: SecoKeyval, mnemonic: string, mnemonicPass: string) {
  return new BtcWallet(kv, mnemonic, mnemonicPass, btcNetworkType);
}

export function newEthWallet(kv: SecoKeyval, mnemonic: string, mnemonicPass: string) {
  return new EthWallet(kv, mnemonic, mnemonicPass, ethNetworkType);
}

export function newXrpWallet(kv: SecoKeyval, mnemonic: string, mnemonicPass: string) {
  return new XrpWallet(kv, mnemonic, mnemonicPass, xrpNetworkType);
}

export {getOrInitializeMnemonic} from "../core/mnemonic";
export {Balance, Wallet, WalletType, BtcWallet, EthWallet, XrpWallet};
