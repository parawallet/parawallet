import {assert, expect} from "chai";
import keypairs = require("ripple-keypairs");
import binary = require("ripple-binary-codec");
import addr = require("ripple-address-codec");

import {signWithKeypair} from "../src/core/xrp/sign";

describe("XRP", () => {
  it("Public Address", () => {
    const address = "rQHiXURDfR62agxA8ykZCJ3PFrky83ALd8";
    const secret = "shkXc99SoJhhHJHkL8v79N1YNGWad";

    const kp = keypairs.deriveKeypair(secret);
    console.log(`Public: ${kp.publicKey}, Private: ${kp.privateKey}`);

    const a = keypairs.deriveAddress(kp.publicKey);
    console.log(`Address: ${a}`);
  });

  it("Test", () => {
    const promise = Promise.all([Promise.resolve("INFO"), "test"])
      .then((x) => {throw new Error("error"); })
      .then((x) => console.log("Resolved: " + x))
      .catch((e) => console.error("Catch: " + e));


  });
});
