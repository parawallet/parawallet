import {ChainType, CoinType, generatePath} from "../bip44-path";
import * as C from "../../constants";
import { EthNetworkType } from "./eth-wallet";
import { Wallet, providers, HDNode, utils } from "ethers";
import { stringifyErrorReplacer } from "../../util/errors";
import {ExplorerDataType} from "../wallet";
import { loggers } from "../../util/logger";

class Params {
    constructor(addressIndex) {
        this.addressIndex = addressIndex;
    }
}

// todo support multiple addresses
export class EthWalletRpc {
    constructor(kv, mnemonic, pass, networkType) {
        this.logger = loggers.getLogger("EthWalletRpc");
        this.kv = kv;
        this.pass = pass || "";
        if (!mnemonic) {
            throw new Error("no mnemonic");
        }
        this.mnemonic = mnemonic;
        this.wallets = [];

        const networkName = EthNetworkType[networkType];
        const network = providers.networks[networkName];
        this.provider = new providers.EtherscanProvider(network);
    }

    async initialize(createEmpty) {
        if (createEmpty) {
            this.params = new Params(0);
            this.fillWallets();
            return this.persistParams();
        }

        const params = await this.kv.get(C.ETH_PARAMS);
        if (params) {
            this.logger.debug("PARAMS: " + JSON.stringify(params));
            this.params = params;
            this.fillWallets();
        } else {
            const index = await this.discover();
            this.logger.debug(`discovered index=${index}`);
            this.addressIndex = index;
            this.fillWallets();
            return this.persistParams();
        }
    }

    fillWallets() {
        for (let index = 0; index <= this.addressIndex; index++) {
            this.addNewWallet(index);
        }
    }

    createNewWallet(index) {
        const path = generatePath(CoinType.ETH, ChainType.EXTERNAL, index);
        const hdnode = HDNode.fromSeed(HDNode.mnemonicToSeed(this.mnemonic, this.pass)).derivePath(path);
        return new Wallet(hdnode.privateKey, this.provider);
    }

    addNewWallet(index) {
        return this.wallets[index] = this.createNewWallet(index);
    }

    async discover() {
        this.logger.debug("Discovering addresses");
        try {
            return await this.discoverAccounts(0, 0);
        } catch (error) {
            this.logger.error(JSON.stringify(error, stringifyErrorReplacer));
            return 0;
        }
    }

    async discoverAccounts(index, gap) {
        const address = this.createNewWallet(index).address;
        const amount = await this.provider.getBalance(address);
        if (!amount || amount.isZero()) {
            gap++;
            this.logger.debug(`${index} -> ${address} has NO balance. gap: ${gap}`);
        } else {
            this.logger.debug(`${index} -> ${address} has balance=${amount}.`);
            gap = 0;
        }
        if (gap < C.GAP_LIMIT) {
            return this.discoverAccounts(index + 1, gap);
        } else {
            return Math.max(0, index - gap);
        }
    }

    getWalletBalances() {
        return this.wallets.map((wallet) => {
            const address = wallet.address;
            return this.provider.getBalance(address).then((amount) => {
                this.logger.debug(`Balance for ${address} = ${amount}`);
                return {address: address, amount: amount / 1.0e18};
            }).catch((e) => {
                this.logger.error(JSON.stringify(e));
                return {address: address, amount: 0};
            });
        });
    }

    async addNewAddress() {
        this.addressIndex++;
        await this.persistParams();
        return this.addNewWallet(this.addressIndex).address;
    }

    getHistory(address) {
        // https://docs.ethers.io/ethers.js/html/api-providers.html#etherscan
        return this.provider.getHistory(address);
    }

    getTransaction(txhash) {
        return this.provider.getTransaction(txhash);
    }

    async send(from, toAddr, etherAmount) {
        const wallet = this.wallets.find((w) => w.address === from);
        if (!wallet) {
            const notFound = `Wallet for address: ${from} not found!`;
            this.logger.error(notFound);
            throw notFound;
        }

        // todo check if we need to do something related to big numbers
        const options = {
            gasLimit: 30000,
            gasPrice: utils.bigNumberify("20000000000"),
        };
        const amount = etherAmount * 1e18;

        const transactionResult = await wallet.send(toAddr, amount, options);
        this.logger.debug("txn hash: " + JSON.stringify(transactionResult));
        return transactionResult.hash;
    }

    getExplorerURL(type) {
        return this.provider ? this.provider.baseUrl + "/" + type + "/" : null;
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

    validate(address) {
        utils.getAddress(address);
    }
}
