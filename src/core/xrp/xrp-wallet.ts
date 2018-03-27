import SecoKeyval from "seco-keyval";
import {AbstractWallet, Balance, Wallet} from "../wallet";
import {XrpWalletRpc} from "./wallet-rpc";

export enum XrpNetworkType {
    MAIN, TEST,
}

export class XrpWallet extends AbstractWallet implements Wallet {
    private readonly rpc: XrpWalletRpc;

    constructor(kv: SecoKeyval, mnemonic: string, pass: string, networkType: XrpNetworkType) {
        super("XRP", "Ripple");
        this.rpc = new XrpWalletRpc(kv, mnemonic, pass, networkType);
        console.info(`XRP using ${XrpNetworkType[networkType]} network`);
    }

    public initialize(createEmpty: boolean) {
        return this.rpc.initialize(createEmpty);
    }

    public defaultAddress() {
        return this.rpc.defaultAddress;
    }

    public allAddresses(): ReadonlyArray<string> {
        return [this.rpc.defaultAddress];
    }

    public addNewAddress() {
        return this.rpc.addNewAddress();
    }

    public detailedBalance(): Promise<Balance[]> {
        return this.rpc.getAccountBalances();
    }

    public sendFrom(from: string, toAddress: string, amount: number): Promise<string> {
        return this.rpc.send(from, toAddress, amount);
    }

    public getExporerURL() {
        return "https://xrpcharts.ripple.com/#/transactions/";
    }
}
