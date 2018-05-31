import SecoKeyval from "seco-keyval";
import * as moment from "moment";
import {Balance, Wallet, TransactionStatus, Transaction, ExplorerDataType} from "../wallet";
import {AbstractWallet} from "../abstract-wallet";
import {XrpWalletRpc} from "./wallet-rpc";
import * as C from "../../constants";
import {FormattedPaymentTransaction, Outcome} from "ripple-lib/dist/npm/transaction/types";

export enum XrpNetworkType {
    MAIN, TEST,
}

export class XrpWallet extends AbstractWallet implements Wallet {
    private readonly rpc: XrpWalletRpc;

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: XrpNetworkType) {
        super("XRP", "Ripple", kv);
        this.rpc = new XrpWalletRpc(kv, mnemonic, pass, networkType);
        this.logger.info(`XRP using ${XrpNetworkType[networkType]} network`);
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

    public getExporerURL(type: ExplorerDataType) {
        if (type === "address") {
            return null;
        }
        return "https://xrpcharts.ripple.com/#/transactions/";
    }

    protected async getTransactions(address: string): Promise<Transaction[]> {
        const txns = await this.rpc.getTransactions(address);
        const result: Transaction[] = [];
        txns.forEach((tx) => {
            this.logger.debug(`XRP TX: ${JSON.stringify(tx)}`);
            if (isPaymentTransaction(tx)) {
                const spec = tx.specification;
                const amount = address === spec.source.address
                    ? Number(spec.source.amount.value) : Number(spec.destination.amount.value);
                const status = transactionStatus(tx.outcome);
                const timestamp = tx.outcome.timestamp ? moment(tx.outcome.timestamp).valueOf() : 0;
                result.push({id: tx.id, timestamp, source: spec.source.address, destination: spec.destination.address, amount, status});
            }
        });
        return result;
    }

    protected async transactionStatus(txid: string): Promise<TransactionStatus> {
        const outcome = await this.rpc.getTransactionOutcome(txid);
        // https://ripple.com/build/transactions/#full-transaction-response-list
        this.logger.debug(`TX OUTCOME: ${JSON.stringify(outcome)}`);
        if (outcome) {
            return transactionStatus(outcome);
        }
        return "pending";
    }

    public validateAddress(address: string) {
        // TODO: not implemented yet
    }
}

function transactionStatus(outcome: Outcome): TransactionStatus {
    if (outcome.result === "tesSUCCESS") {
        return "success";
    } else {
        return "failure";
    }
}

function isPaymentTransaction(tx: any): tx is FormattedPaymentTransaction {
    return tx.type === "payment";
}
