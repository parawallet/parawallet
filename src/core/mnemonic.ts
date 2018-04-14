import * as bip39 from "bip39";
import SecoKeyval from "seco-keyval";
import * as C from "../constants";

export async function getOrInitializeMnemonic(kv: SecoKeyval) {
    let mnemonic: string | undefined = await kv.get(C.MNEMONIC);

    if (mnemonic) {
        console.log("read mnemonic:" + mnemonic);
        return mnemonic;
    }

    mnemonic = bip39.generateMnemonic();
    console.log("generated mnemonic:" + mnemonic);
    await kv.set(C.MNEMONIC, mnemonic);
    return mnemonic;
}

export function restoreMnemonic(mnemonic: string, kv: SecoKeyval) {
    return kv.set(C.MNEMONIC, mnemonic);
}

export function validateMnemonic(mnemonic: string) {
    return bip39.validateMnemonic(mnemonic);
}
