import * as bip39 from "bip39";
// import createVault = require("eth-lightwallet");
import {createVault, KeyStore} from "eth-lightwallet";
import {HookedWeb3Provider} from "hooked-web3-provider";
import {SecoKeyval} from "seco-keyval";
import Web3 = require("web3");
import {ChainType, CoinType, generatePath} from "./bip44-path";


// todo support multiple addresses
export class EthAddressGenerator {
    private readonly kv: SecoKeyval;
    private readonly pass: string;
    private readonly coinType: CoinType = CoinType.ETH;
    private web3: Web3;
    private receiveAddress = "";
    private keystore: KeyStore;
    private mnemonic: string;

    constructor(kv: SecoKeyval, pass?: string) {
        if (!kv) {
            throw new Error("KV is required");
        }
        if (!kv.hasOpened) {
            throw new Error("KV is not ready yet!");
        }
        this.kv = kv;
        this.pass = pass || "";
    }

    public initialize() {
        const that = this;
        const promise = new Promise((resolve, reject) => {
            that.kv.get("mnemonic").then((mnemonic) => {
                if (!mnemonic) {
                    throw new Error("no mnemonic");
                } else {
                    console.log("read mnemonic:" + mnemonic);
                    if (!bip39.validateMnemonic(mnemonic)) {
                        alert("Invalid mnemonic!");
                    }
                    that.mnemonic = mnemonic;
                    createVault({
                            hdPathString: generatePath(this.coinType, ChainType.EXTERNAL, 0),
                            password: that.pass,
                            seedPhrase: mnemonic }
                        , (err: any, ks: any) => {
                            that.keystore = ks;
                            that.keystore.keyFromPassword(that.pass, (err2: any, pwDerivedKey: any) => {
                                that.keystore.generateNewAddress(pwDerivedKey, 1);
                                that.receiveAddress = that.keystore.getAddresses()[0];
                                alert("addr:" + that.receiveAddress);
                                const web3Provider: any = new HookedWeb3Provider({
                                    host: "https://rinkeby.infura.io/",
                                    transaction_signer: that.keystore });
                                this.web3 = new Web3(web3Provider);
                                resolve("success");
                            });
                        });
                }
            });
        });
        return promise;
    }


}
