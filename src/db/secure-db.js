import SecoKeyval from "seco-keyval";
import {remote} from "electron";
import * as path from "path";

const appPath = remote.app.getPath("userData");
const walletPath = path.join(appPath, "wallet.db");
console.log("wallet db path: " + walletPath);

const kv = new SecoKeyval(walletPath, { appName: "the-wallet", appVersion: "1.0.0" });

export function open(password) {
  return kv.open(password);
}

export function get() {
  return kv;
}
