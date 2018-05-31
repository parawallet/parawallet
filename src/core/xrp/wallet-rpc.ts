import {RippleAPI} from "ripple-lib";
import SecoKeyval from "seco-keyval";
import * as C from "../../constants";
import {generateAddress, XrpAccount} from "./address-gen";
import {XrpNetworkType} from "./xrp-wallet";
import { Balance, Transaction } from "../wallet";
import { stringifyErrorReplacer } from "../../util/errors";
import { loggers } from "../../util/logger";

const testServer = "wss://s.altnet.rippletest.net:51233";
const testDataServer = testServer;

const mainServer = "wss://s1.ripple.com";
const mainDataServer = "wss://s2.ripple.com";

function serverAddress(networkType: XrpNetworkType, needHistory: boolean) {
    switch (networkType) {
        case XrpNetworkType.MAIN:
            return needHistory ? mainDataServer : mainServer;
        default:
            return needHistory ? testDataServer : testServer;
    }
}

class Params {
    public readonly addressIndex: number;

    constructor(addressIndex: number) {
        this.addressIndex = addressIndex;
    }
}

export class XrpWalletRpc {
    private readonly logger = loggers.getLogger("XrpWalletRpc");
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

    public async initialize(createEmpty: boolean) {
        if (createEmpty) {
            this.params = new Params(0);
            this.fillAccounts();
            return this.persistParams();
        }

        const params: Params = await this.kv.get(C.XRP_PARAMS);
        if (params) {
            this.logger.debug("PARAMS: " + JSON.stringify(params));
            this.params = params;
            this.fillAccounts();
        } else {
            const index = await this.discover();
            this.logger.debug(`discovered index=${index}`);
            this.addressIndex = index;
            this.fillAccounts();
            return this.persistParams();
        }
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
        this.logger.debug(index + ": ADDRESS-> " + account.address);
        this.accounts[index] = account;
        return account;
    }

    private async discover(): Promise<number> {
        this.logger.debug("Discovering addresses");
        const api = this.newRippleAPI(false);

        try {
            await api.connect();
            const index = await this.discoverAccounts(api, 0, 0);
            return index;
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer));
            return 0;
        } finally {
            api.disconnect();
        }
    }

    private async discoverAccounts(api: RippleAPI, index: number, gap: number): Promise<number> {
        const account = generateAddress(this.mnemonic, this.pass, index);
        const emptyBalance = {address: account.address, amount: 0};

        try {
            const balance = await this.getAccountBalance(api, account.address) || emptyBalance;
            return this.inspectAndDiscoverAccount(api, index, gap, balance);
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer));
            return this.inspectAndDiscoverAccount(api, index, gap, emptyBalance);
        }
    }

    private inspectAndDiscoverAccount(api: RippleAPI, index: number, gap: number, balance: Balance) {
        if (balance.amount === 0) {
            gap++;
            this.logger.debug(`${index} -> ${balance.address} has NO balance. gap: ${gap}`);
        } else {
            this.logger.debug(`${index} -> ${balance.address} has balance=${balance.amount}.`);
            gap = 0;
        }
        if (gap < C.GAP_LIMIT) {
            return this.discoverAccounts(api, index + 1, gap);
        } else {
            return Math.max(0, index - gap);
        }
    }

    public getAccountBalances(): Promise<Balance[]> {
        const api = this.newRippleAPI(false);
        const balancePromise = api.connect()
        .then(() => {
            return this.accounts.map((account) => this.getAccountBalance(api, account.address));
        }).then((promises) => Promise.all(promises).then((balances) => {
            api.disconnect();
            return balances;
        })).catch((e) => {
            api.disconnect();
            this.logger.error(JSON.stringify(e));
            return [];
        });
        return balancePromise;
    }

    private async getAccountBalance(api: RippleAPI, address: string): Promise<Balance> {
        try {
            const info = await api.getAccountInfo(address);
            this.logger.debug(`Balance for ${address} = ${info.xrpBalance}`);
            return {address, amount: Number(info.xrpBalance)};
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer));
            return {address, amount: 0};
        }
    }

    public async addNewAddress(): Promise<string> {
        this.addressIndex++;
        await this.persistParams();
        return this.addAccount(this.addressIndex).address;
    }

    public async getTransactions(address: string) {
        const api = this.newRippleAPI(true);
        try {
            await api.connect();
            const tx = await api.getTransactions(address, {types: ["payment"]});
            return tx;
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer, 2));
            return [];
        }
    }

    public async getTransactionOutcome(txid: string) {
        const api = this.newRippleAPI(true);
        try {
            await api.connect();
            const tx = await api.getTransaction(txid);
            return tx.outcome;
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer));
            return null;
        }
    }

    public async send(from: string, toAddress: string, amount: number) {
        const account = this.accounts.find((acc) => acc.address === from);
        if (!account) {
            const notFound = `Wallet for address: ${from} not found!`;
            this.logger.error(notFound);
            throw notFound;
        }

        const payment = this.createPayment(account.address, toAddress, String(amount));
        const api = this.newRippleAPI(false);

        try {
            await api.connect();
            const prepared = await api.preparePayment(account.address, payment);
            this.logger.debug("TX: " + prepared.txJSON);

            const signedTxn = api.sign(prepared.txJSON, account.keypair);
            this.logger.debug("TX ID:" + signedTxn.id);

            const result = await api.submit(signedTxn.signedTransaction);
            this.logger.debug(`TX RESULT: ${JSON.stringify(result)}`);
            return signedTxn.id;
        } finally {
            api.disconnect();
        }
    }

    private createPayment(from: string, toAddress: string, amount: string) {
        const source = {address: from, maxAmount: {value: amount, currency: "XRP"}};
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

    private newRippleAPI(needHistory: boolean) {
        return new RippleAPI({
            server: serverAddress(this.networkType, needHistory),
        });
    }
}
