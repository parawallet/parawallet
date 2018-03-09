import {XrpWalletRpc} from "./wallet-rpc";
import {AbstractWallet, Balance, Wallet} from "../wallet";

export enum XrpNetworkType {
    MAIN, TEST,
}

export class XrpWallet extends AbstractWallet implements Wallet {
    private readonly rpc: XrpWalletRpc;

    constructor(mnemonic: string, pass: string, networkType: XrpNetworkType) {
        super("XRP", "Ripple");
        this.rpc = new XrpWalletRpc(mnemonic, pass, networkType);
    }

    public initialize(createEmpty: boolean) {
        return this.rpc.initialize();
    }

    public addresses(): string[] {
        return [this.rpc.publicAddress];
    }

    public totalBalance() {
        return this.rpc.getBalance();
    }

    public detailedBalance() {
        return this.rpc.getBalance().then((amount: number) => [{address: this.rpc.publicAddress, amount}]);
    }

    public send(toAddress: string, amount: number): Promise<string> {
        return this.rpc.send(toAddress, amount);
    }

    public getExporerURL() {
        return "https://xrpcharts.ripple.com/#/transactions/";
    }
}
