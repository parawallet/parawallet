import SecoKeyval from "seco-keyval";
import {AbstractWallet, Balance, Wallet} from "../wallet";
import {EthWalletRpc} from "./wallet-rpc";

export enum EthNetworkType {
    mainnet, homestead, ropsten, testnet, rinkeby,
}

export class EthWallet extends AbstractWallet implements Wallet {
    private readonly rpc: EthWalletRpc;

    constructor(kv: SecoKeyval, mnemonic: string, mnemonicPass: string, network: EthNetworkType) {
        super("ETH", "Ethereum");
        this.rpc = new EthWalletRpc(kv, mnemonic, mnemonicPass, network);
        console.info(`ETH using ${EthNetworkType[network]} network`);
    }

    public initialize(createEmpty: boolean) {
        return this.rpc.initialize(createEmpty);
    }

    public defaultAddress() {
        return this.rpc.defaultAddress;
    }

    public allAddresses(): ReadonlyArray<string> {
        return this.rpc.allAddresses;
    }

    public addNewAddress(): Promise<string> {
        return this.rpc.addNewAddress();
    }

    public detailedBalance(): Promise<Balance[]> {
        const balancePromises: Array<Promise<Balance>> = this.rpc.getWalletBalances();
        return Promise.all(balancePromises);
    }

    public sendFrom(from: string, toAddress: string, amount: number): Promise<string> {
        return this.rpc.send(from, toAddress, amount);
    }

    public getExporerURL() {
        return this.rpc.explorerURL;
    }
}
