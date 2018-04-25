import SecoKeyval from "seco-keyval";
import {AbstractWallet, Balance, Wallet, TransactionStatus} from "../wallet";
import {XrpWalletRpc} from "./wallet-rpc";
import * as C from "../../constants";

export enum XrpNetworkType {
    MAIN, TEST,
}

export class XrpWallet extends AbstractWallet implements Wallet {
    private readonly rpc: XrpWalletRpc;

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: XrpNetworkType) {
        super("XRP", "Ripple", kv);
        this.rpc = new XrpWalletRpc(kv, mnemonic, pass, networkType);
        console.info(`XRP using ${XrpNetworkType[networkType]} network`);
    }

    protected initializeImpl(createEmpty: boolean) {
        return this.rpc.initialize(createEmpty);
    }

    protected addNewAddressImpl() {
        return this.rpc.addNewAddress();
    }

    protected updateBalancesImpl(): Promise<Balance[]> {
        return this.rpc.getAccountBalances();
    }

    protected sendImpl(toAddress: string, amount: number, fromAddress?: string): Promise<string> {
        return this.rpc.send(fromAddress!, toAddress, amount);
    }

    public getExporerURL() {
        return "https://xrpcharts.ripple.com/#/transactions/";
    }

    protected async transactionStatus(txid: string): Promise<TransactionStatus> {
        let st: TransactionStatus = "pending";
        const outcome = await this.rpc.getTransactionOutcome(txid);
        // https://ripple.com/build/transactions/#full-transaction-response-list
        console.log(`XRP TX OUTCOME: ${JSON.stringify(outcome)}`);
        if (outcome) {
            if (outcome.result === "tesSUCCESS") {
                st = "success";
            } else {
                st = "failure";
            }
        }
        return st;
    }
}
