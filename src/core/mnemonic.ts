import * as bip39 from "bip39";
import SecoKeyval from "seco-keyval";
import * as C from "../constants";
import {toast} from "react-toastify";

export async function getOrInitializeMnemonic(kv: SecoKeyval) {
    if (!kv) {
        throw new Error("KV is required");
    }
    if (!kv.hasOpened) {
        throw new Error("KV is not ready yet!");
    }

    let mnemonic: string | undefined = await kv.get(C.MNEMONIC);

    if (mnemonic) {
        console.log("read mnemonic:" + mnemonic);

        if (!bip39.validateMnemonic(mnemonic)) {
            alert("Invalid mnemonic!");
        }
        return mnemonic;
    }

    mnemonic = bip39.generateMnemonic();
    console.log("generated mnemonic:" + mnemonic);
    await kv.set(C.MNEMONIC, mnemonic);
    toast.info("Please write down following words to backup your wallet: " + mnemonic);
    return mnemonic;
}

export function restoreMnemonic(mnemonic: string, kv: SecoKeyval) {
    if (!kv) {
        throw new Error("KV is required");
    }
    if (!kv.hasOpened) {
        throw new Error("KV is not ready yet!");
    }
    if (!bip39.validateMnemonic(mnemonic)) {
        alert("Invalid mnemonic!");
    }
    return kv.set(C.MNEMONIC, mnemonic);
}
