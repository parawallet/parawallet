import * as bip39 from "bip39";
import {SecoKeyval} from "seco-keyval";

export function getOrInitializeMnemonic(kv: SecoKeyval) {
  if (!kv) {
    throw new Error("KV is required");
  }
  if (!kv.hasOpened) {
    throw new Error("KV is not ready yet!");
  }

  return new Promise < string > ((resolve, reject) => {
    kv.get("mnemonic").then((mnemonic: string) => {
      if (mnemonic) {
        console.log("read mnemonic:" + mnemonic);
        if (!bip39.validateMnemonic(mnemonic)) {
          alert("Invalid mnemonic!");
        }
        resolve(mnemonic);
        return;
      }

      mnemonic = bip39.generateMnemonic();
      console.log("generated mnemonic:" + mnemonic);
      kv.set("mnemonic", mnemonic).then(() => {
        resolve(mnemonic);
        alert("Please write down following words to backup your wallet: " + mnemonic);
      });
    });
  });
}
