import {assert, expect} from "chai";
import keypairs = require("ripple-keypairs");
import {RippleAPI} from "ripple-lib";
import {XrpAccount} from "../src/core/xrp/address-gen";

describe("XRP", () => {
  const api = new RippleAPI({
    server: "wss://s.altnet.rippletest.net:51233",
  });

  before(async function() {
    this.timeout(5000);
    await api.connect();
  });
  after(async () => await api.disconnect());

  it("Public Address", () => {
    const address = "rQHiXURDfR62agxA8ykZCJ3PFrky83ALd8";
    const secret = "shkXc99SoJhhHJHkL8v79N1YNGWad";

    const kp = keypairs.deriveKeypair(secret);
    console.log(`Public: ${kp.publicKey}, Private: ${kp.privateKey}`);

    const a = keypairs.deriveAddress(kp.publicKey);
    console.log(`Address: ${a}`);
  });

  it("Sign TX", async () => {
    const account = new XrpAccount("rQHiXURDfR62agxA8ykZCJ3PFrky83ALd8", "shkXc99SoJhhHJHkL8v79N1YNGWad");
    const target = "rKoehNRmKRR7Qia5HmomEDKJ5wb2cVtbPo";

    const payment = createPayment(account.address, target, String(100));
    const prepared = await api.preparePayment(account.address, payment);

    console.log(`ACCOUNT: ${JSON.stringify(account)}`);
    const signedTxn = api.sign(prepared.txJSON, account.keypair);
  });

  it("Sign TX Keypair", async () => {
    const account = new XrpAccount("rKoehNRmKRR7Qia5HmomEDKJ5wb2cVtbPo",
      {
        privateKey: "00944EBB14450AA47C670AF0462BA845960853C7ADC938534917D38EA1F168A98B",
        publicKey: "022182C21F639BDF6DABAC34831FDDF8C5DD69F4BCFDDA1CCB1B7561DA68C19CEE",
      });

    const target = "rQHiXURDfR62agxA8ykZCJ3PFrky83ALd8";

    const payment = createPayment(account.address, target, String(100));

    const prepared = await api.preparePayment(account.address, payment);

    const signedTxn = api.sign(prepared.txJSON, account.keypair);
  });
});


function createPayment(from: string, toAddress: string, amount: string) {
  const source = {address: from, maxAmount: {value: amount, currency: "XRP"}};
  const destination = {address: toAddress, amount: {value: amount, currency: "XRP"}};
  return {source, destination};
}
