import SecoKeyval from "seco-keyval";
import {AbstractWallet, Balance, Wallet, TransactionStatus} from "../wallet";
import {EthWalletRpc} from "./wallet-rpc";
import * as C from "../../constants";
import { stringifyErrorReplacer } from "../../util/errors";

export enum EthNetworkType {
    mainnet, homestead, ropsten, testnet, rinkeby,
}

export class EthWallet extends AbstractWallet implements Wallet {
    private readonly rpc: EthWalletRpc;

    constructor(kv: SecoKeyval, mnemonic: string, mnemonicPass: string, network: EthNetworkType) {
        super("ETH", "Ethereum", kv);
        this.rpc = new EthWalletRpc(kv, mnemonic, mnemonicPass, network);
        console.info(`ETH using ${EthNetworkType[network]} network`);
    }

    protected initializeImpl(createEmpty: boolean) {
        return this.rpc.initialize(createEmpty);
    }

    protected addNewAddressImpl(): Promise<string> {
        return this.rpc.addNewAddress();
    }

    protected updateBalancesImpl(): Promise<Balance[]> {
        const balancePromises: Array<Promise<Balance>> = this.rpc.getWalletBalances();
        return Promise.all(balancePromises);
    }

    protected sendImpl(toAddress: string, amount: number, fromAddress?: string): Promise<string> {
        return this.rpc.send(fromAddress, toAddress, amount);
    }

    public getExporerURL() {
        return this.rpc.explorerURL;
    }

    protected async transactionStatus(txid: string): Promise<TransactionStatus> {
        let st: TransactionStatus = "pending";
        try {
            // https://docs.ethers.io/ethers.js/html/api-providers.html#transactionresponse
            const receipt = await this.rpc.getTransactionReceipt(txid);
            console.log(`ETH TX RECEIPT: ${JSON.stringify(receipt)}`);
            if (receipt && receipt.blockHash) {
                st = "success";
            }
            // TODO: failed transaction ???
        } catch (error) {
            console.log(JSON.stringify(error, stringifyErrorReplacer));
        }
        return st;
    }
}
