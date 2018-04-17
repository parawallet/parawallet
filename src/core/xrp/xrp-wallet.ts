import SecoKeyval from "seco-keyval";
import {AbstractWallet, Balance, Wallet} from "../wallet";
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

    public sendFrom(from: string, toAddress: string, amount: number): Promise<string> {
        return this.rpc.send(from, toAddress, amount);
    }

    public getExporerURL() {
        return "https://xrpcharts.ripple.com/#/transactions/";
    }
}
