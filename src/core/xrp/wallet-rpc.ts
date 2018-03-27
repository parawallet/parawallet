import {RippleAPI} from "ripple-lib";
import SecoKeyval from "seco-keyval";
import * as C from "../../constants";
import {generateAddress, XrpAccount} from "./address-gen";
import {signWithKeypair} from "./sign";
import {XrpNetworkType} from "./xrp-wallet";
import { Balance } from "../wallet";

const testServerAddress = "wss://s.altnet.rippletest.net:51233";
const mainServerAddress = "wss://s1.ripple.com";

function serverAddress(networkType: XrpNetworkType) {
    switch (networkType) {
        case XrpNetworkType.MAIN:
            return mainServerAddress;
        default:
            return testServerAddress;
    }
}

class Params {
    public readonly addressIndex: number;

    constructor(addressIndex: number) {
        this.addressIndex = addressIndex;
    }
}

export class XrpWalletRpc {
    private readonly kv: SecoKeyval;
    private readonly mnemonic: string;
    private readonly pass: string;
    private readonly networkType: XrpNetworkType;
    private params = new Params(0);
    private accounts: XrpAccount[] = [];

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: XrpNetworkType) {
        this.kv = kv;
        this.mnemonic = mnemonic;
        this.pass = pass;
        this.networkType = networkType;
    }

    public initialize(createEmpty: boolean) {
        if (createEmpty) {
            this.params = new Params(0);
            this.fillAccounts();
            return this.persistParams();
        }

        const promise = new Promise((resolve, reject) => {
            this.kv.get(C.XRP_PARAMS).then((params) => {
                if (params) {
                    console.log("XRP PARAMS: " + JSON.stringify(params));
                    this.params = params;
                    this.fillAccounts();
                    resolve("success");
                } else {
                    this.discover().then((index) => {
                        console.info(`XRP discovered index=${index}`);
                        this.addressIndex = index;
                        this.fillAccounts();
                        this.persistParams().then(() => resolve("success"));
                    });
                }
            }).catch((e) => reject(e));
        });
        return promise;
    }

    private fillAccounts() {
        for (let index = 0; index <= this.addressIndex; index++) {
            this.addAccount(index);
        }

        // from testnet https://ripple.com/build/xrp-test-net/
        // const address = "rQHiXURDfR62agxA8ykZCJ3PFrky83ALd8";
        // const secret = "shkXc99SoJhhHJHkL8v79N1YNGWad";
        // this.accounts.push(new XrpAccount(address, secret));
    }

    private addAccount(index: number) {
        const account = generateAddress(this.mnemonic, this.pass, index);
        console.log(index + ": XRP ADDRESS-> " + account.address);
        console.log(index + ": XRP PUBLIC -> " + account.publicKey);
        console.log(index + ": XRP PRIVATE-> " + account.privateKey);
        this.accounts[index] = account;
        return account;
    }

    private discover(): Promise<number> {
        console.log("Discovering addresses for XRP");
        const api = new RippleAPI({
            server: serverAddress(this.networkType),
        });

        return api.connect().then(() => {
            return this.discoverAccounts(api, 0, 0);
        }).catch((e) => {
            api.disconnect();
            console.error(JSON.stringify(e));
            return 0;
        });
    }

    private discoverAccounts(api: RippleAPI, index: number, gap: number): Promise<number> {
        const account = generateAddress(this.mnemonic, this.pass, index);
        return this.getAccountBalance(api, account.address).then((balance) => {
            balance = balance || {address: account.address, amount: Number(0)};
            return this.inspectAndDiscoverAccount(api, index, gap, balance);
        }).catch((e) => {
            console.error(JSON.stringify(e));
            return this.inspectAndDiscoverAccount(api, index, gap, {address: account.address, amount: Number(0)});
        });
    }

    private inspectAndDiscoverAccount(api: RippleAPI, index: number, gap: number, balance: Balance) {
        if (balance.amount === 0) {
            gap++;
            console.error(`XRP ${index} -> ${balance.address} has NO balance. gap: ${gap}`);
        } else {
            console.info(`XRP ${index} -> ${balance.address} has balance=${balance.amount}.`);
            gap = 0;
        }
        if (gap < C.GAP_LIMIT) {
            return this.discoverAccounts(api, index + 1, gap);
        } else {
            api.disconnect();
            return Math.max(0, index - gap);
        }
    }

    public getAccountBalances(): Promise<Balance[]> {
        const api = new RippleAPI({
            server: serverAddress(this.networkType),
        });

        const balancePromise = api.connect()
        .then(() => {
            return this.accounts.map((account) => this.getAccountBalance(api, account.address));
        }).then((promises) => Promise.all(promises).then((balances) => {
            api.disconnect();
            return balances;
        })).catch((e) => {
            api.disconnect();
            console.error(JSON.stringify(e));
            return [];
        });
        return balancePromise;
    }

    private getAccountBalance(api: RippleAPI, address: string): Promise<Balance> {
        return api.getAccountInfo(address).then((info) => {
            console.info(`XRP Balance for ${address} = ${info.xrpBalance}`);
            return {address, amount: Number(info.xrpBalance)};
        });
    }

    public addNewAddress(): Promise<string> {
        this.addressIndex++;
        return this.persistParams().then(() => {
            return this.addAccount(this.addressIndex).address;
        });
    }

    public send(from: string, toAddress: string, amount: number) {
        const account = this.accounts.find((acc) => acc.address === from);
        if (!account) {
            return Promise.reject("<unknown-address>");
        }

        // TODO: explicitly typed as any. see https://github.com/ripple/ripple-lib/issues/866
        const payment: any = this.createPayment(toAddress, String(amount));

        const api = new RippleAPI({
            server: serverAddress(this.networkType),
        });

        const signPromise = api.connect()
            .then(() => api.preparePayment(account.address, payment))
            .then((prepared) => {
                const signedTxn = (account.secret)
                    ? api.sign(prepared.txJSON, account.secret)
                    : signWithKeypair(prepared.txJSON, account);
                console.log("ripple txn id:" + signedTxn.id);
                return signedTxn;
            });

        const submitPromise = signPromise
            .then((signedTxn) => api.submit(signedTxn.signedTransaction));

        return Promise.all([signPromise, submitPromise])
            .then((result) => {
                api.disconnect();
                const submitResult = result[1];
                alert(`RESULT: ${JSON.stringify(submitResult)}`);

                const signedTxn = result[0];
                return signedTxn.id;
            }).catch((e) => {
                api.disconnect();
                console.error(JSON.stringify(e));
                return "<invalid-tx>";
            });
    }

    private get defaultAccount() {
        return this.accounts[this.addressIndex];
      }

    public get defaultAddress(): string {
      return this.defaultAccount.address;
    }

    public get allAddresses(): ReadonlyArray<string> {
        return this.accounts.map((account) => account.address);
    }

    private createPayment(toAddress: string, amount: string) {
        const source = {address: this.defaultAddress, maxAmount: {value: amount, currency: "XRP"}};
        const destination = {address: toAddress, amount: {value: amount, currency: "XRP"}};
        return {source, destination};
    }

    private get addressIndex() {
        return this.params.addressIndex;
    }

    private set addressIndex(addressIndex: number) {
        this.params = new Params(addressIndex);
    }

    private persistParams() {
        return this.kv.set(C.XRP_PARAMS, this.params);
    }

}
