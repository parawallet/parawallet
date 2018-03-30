import {assert, expect} from "chai";

import { BtcWallet } from "../src/core/btc/btc-wallet";

import SecoKeyval from "seco-keyval";

describe("BTC Local", () => {
  it("Create Wallet", async () => {
    // const btc = new BtcWallet(null);

    let kv = new SecoKeyval("tmp.db");
    await kv.open("password");

    let map = new Map<string, string>();
    map.set("key", "value");
    await kv.set("key", map);

    kv = new SecoKeyval("tmp.db");
    await kv.open("password");

    map = await kv.get("key");
    console.log("======> " + typeof map);
    assert.equal(map.get("key"), "value");
  });
});
