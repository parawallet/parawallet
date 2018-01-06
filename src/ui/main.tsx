import * as React from "react";
import * as ReactDOM from "react-dom";
import { BtcAddressGenerator } from "../core/btc-address-gen";
import { BtcWallet } from "../core/btc-wallet";
import { EthWallet } from "../core/eth-wallet";
import { Page } from "./page";
import * as db from "./secure-db";

const btcAddressGen = new BtcAddressGenerator(db.get());
const BTC = new BtcWallet(btcAddressGen);
const ETH = new EthWallet();

const wallets = [BTC, ETH];

Promise.all(BTC.initialize()).then(() => {
  ReactDOM.render(
    <Page defaultWalletCode={BTC.code} wallets={wallets} />,
    document.getElementById("root"),
  );
});
