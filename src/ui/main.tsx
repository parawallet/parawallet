import * as React from "react";
import * as ReactDOM from "react-dom";
import { BtcWallet } from "../core/btc-wallet";
import { EthWallet } from "../core/eth-wallet";
import * as db from "./secure-db";

import { Page } from "./page";

const BTC = new BtcWallet(db.get());
const ETH = new EthWallet();

const wallets = [BTC, ETH];

ReactDOM.render(
  <Page defaultWalletCode={BTC.code} wallets={wallets} />,
  document.getElementById("root"),
);
