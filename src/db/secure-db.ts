import {remote} from "electron";
import * as fs from "fs";
import * as path from "path";
import SecoKeyval from "seco-keyval";

const appPath = remote.app.getPath("userData");
const kvStores = new Map<string, SecoKeyval>();

export function open(name: string, password: string) {
  if (kvStores.has(name)) {
    return Promise.resolve(kvStores.get(name));
  }

  const dbPath = path.join(appPath, name + ".db");
  console.log("Opening " + name + " db. Path: " + dbPath);
  const kv = new SecoKeyval(dbPath, { appName: "the-wallet", appVersion: "1.0.0" });
  const p = kv.open(password);
  p.then(() => kvStores.set(name, kv));
  return p;
}

export function get(name: string): SecoKeyval | undefined {
  return kvStores.get(name);
}

export function exists(name: string) {
  const dbPath = path.join(appPath, name + ".db");
  return fs.existsSync(dbPath);
}
