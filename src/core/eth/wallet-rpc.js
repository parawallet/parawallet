import {ChainType, CoinType, generatePath} from "../bip44-path";
import * as C from "../../constants";
import { EthNetworkType } from "./eth-wallet";

const ethers = require("ethers");
const Wallet = ethers.Wallet;

class Params {
    constructor(addressIndex) {
        this.addressIndex = addressIndex;
    }
}

// todo support multiple addresses
export class EthWalletRpc {
    constructor(kv, mnemonic, pass, networkType) {
        this.kv = kv;
        this.pass = pass || "";
        if (!mnemonic) {
            throw new Error("no mnemonic");
        }
        this.mnemonic = mnemonic;
        this.wallets = [];

        const providers = ethers.providers;
        const networkName = EthNetworkType[networkType];
        const network = providers.networks[networkName];
        this.provider = new providers.EtherscanProvider(network);
    }

    initialize(createEmpty) {
        if (createEmpty) {
            this.params = new Params(0);
            this.fillWallets();
            return this.persistParams();
        }

        const promise = new Promise((resolve, reject) => {
            this.kv.get(C.ETH_PARAMS).then((params) => {
                if (params) {
                    console.log("ETH PARAMS: " + JSON.stringify(params));
                    this.params = params;
                    this.fillWallets();
                    resolve("success");
                } else {
                    this.discover().then((index) => {
                        console.info(`ETH discovered index=${index}`);
                        this.addressIndex = index;
                        this.fillWallets();
                        this.persistParams().then(() => resolve("success"));
                    });
                }
            }).catch((e) => reject(e));
        });
        return promise;
    }

    fillWallets() {
        for (let index = 0; index <= this.addressIndex; index++) {
            this.addNewWallet(index);
        }
    }

    createNewWallet(index) {
        const HDNode = ethers.HDNode;
        const path = generatePath(CoinType.ETH, ChainType.EXTERNAL, index);
        const hdnode = HDNode.fromSeed(HDNode.mnemonicToSeed(this.mnemonic, this.pass)).derivePath(path);
        return new Wallet(hdnode.privateKey, this.provider);
    }

    addNewWallet(index) {
        return this.wallets[index] = this.createNewWallet(index);
    }

    discover() {
        console.log("Discovering addresses for ETH");
        return new Promise((resolve, reject) => {
            this.discoverAccounts(0, 0, resolve, reject);
        });
    }

    discoverAccounts(index, gap, resolve, reject) {
        const address = this.createNewWallet(index).address;
        this.provider.getBalance(address).then((amount) => {
            if (!amount || amount.isZero()) {
                gap++;
                console.error(`ETH ${index} -> ${address} has NO balance. gap: ${gap}`);
            } else {
                console.info(`ETH ${index} -> ${address} has balance=${amount}.`);
                gap = 0;
            }
            if (gap < C.GAP_LIMIT) {
                this.discoverAccounts(index + 1, gap, resolve, reject);
            } else {
                resolve(Math.max(0, index - gap));
            }
        }).catch((e) => reject());
    }

    getWalletBalances() {
        return this.allAddresses.map((address) => {
            return this.provider.getBalance(address)
                .then((amount) => {
                    console.info(`ETH Balance for ${address} = ${amount}`);
                    return {address: address, amount: amount / 1.0e18};
                });
        });
    }

    addNewAddress() {
        this.addressIndex++;
        return this.persistParams().then(() => {
            return this.addNewWallet(this.addressIndex).address;
        });
    }

    send(from, toAddr, etherAmount) {
        const wallet = this.wallets.find((w) => w.address === from);
        if (!wallet) {
            return Promise.reject("<unknown-address>");
        }

        // todo check if we need to do something related to big numbers
        var options = {
            gasLimit: 30000,
            gasPrice: ethers.utils.bigNumberify("20000000000"),
        };
        var amount = etherAmount * 1e18;
        var sendPromise = this.wallets[this.addressIndex].send(toAddr, amount, options);
        return sendPromise.then((transactionResult) => {
            console.log("txn hash: " + JSON.stringify(transactionResult));
            return transactionResult.hash;
        })
        .catch((e) => {
            console.error(JSON.stringify(e));
            return "<invalid-tx>";
        });
        // todo return the receipt, tx hash etc
    }

    get defaultAddress() {
        return this.wallets[this.addressIndex].address;
    }

    get allAddresses() {
        return this.wallets.map((w) => w.address);
    }

    get explorerURL() {
        return this.provider ? this.provider.baseUrl + "/tx/" : "";
    }

    get addressIndex() {
        return this.params.addressIndex;
    }

    set addressIndex(index) {
        this.params = new Params(index);
    }

    persistParams() {
        return this.kv.set(C.ETH_PARAMS, this.params);
    }

}
