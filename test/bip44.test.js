import { assert, expect} from "chai";
import * as bip44 from "../src/core/bip44-path";

describe("BIP44", function() {
  it("generate btc external path", () => {
    const expected = "m/44'/0'/0'/0/0";
    const path = bip44.generatePath(bip44.CoinType.BTC, bip44.ChainType.EXTERNAL, 0);
    assert.equal(path, expected);
  });

  it("generate btc change path", () => {
    const expected = "m/44'/0'/0'/1/0";
    const path = bip44.generatePath(bip44.CoinType.BTC, bip44.ChainType.CHANGE, 0);
    assert.equal(path, expected);
  });

  it("generate btc external path with index=1", () => {
    const expected = "m/44'/0'/0'/0/1";
    const path = bip44.generatePath(bip44.CoinType.BTC, bip44.ChainType.EXTERNAL, 1);
    assert.equal(path, expected);
  });

  it("generate test external path", () => {
    const expected = "m/44'/1'/0'/0/0";
    const path = bip44.generatePath(bip44.CoinType.TEST, bip44.ChainType.EXTERNAL, 0);
    assert.equal(path, expected);
  });
});
