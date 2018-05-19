import {remote} from "electron";
import * as fs from "fs";
import * as path from "path";
import SecoKeyval from "seco-keyval";

const appPath = remote.app.getPath("userData");
const kvStores = new Map<string, SecoKeyval>();

export async function open(name: string, password: string) {
  if (kvStores.has(name)) {
    return Promise.resolve(kvStores.get(name));
  }

  const dbPath = path.join(appPath, name + ".db");
  console.log("Opening " + name + " db. Path: " + dbPath);
  const kv = new SecoKeyval(dbPath, { appName: "parawallet", appVersion: "0.1" });
  await kv.open(password);
  kvStores.set(name, kv);
  return kv;
}

export function get(name: string): SecoKeyval | undefined {
  return kvStores.get(name);
}

export function exists(name: string) {
  const dbPath = path.join(appPath, name + ".db");
  return fs.existsSync(dbPath);
}
