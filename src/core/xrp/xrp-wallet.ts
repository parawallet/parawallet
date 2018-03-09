import {XrpWalletRpc} from "./wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "../wallet";

export enum XrpNetworkType {
    MAIN, TEST,
}

export class XrpWallet extends AbstractWallet implements IWallet {
    private readonly rpc: XrpWalletRpc;

    constructor(mnemonic: string, pass: string, networkType: XrpNetworkType) {
        super("XRP", "Ripple");
        this.rpc = new XrpWalletRpc(mnemonic, pass, networkType);
    }

    public initialize(createEmpty: boolean) {
        return this.rpc.initialize();
    }

    public update(callback?: BalanceCallback) {
        const promise = this.rpc.getBalance();
        promise.then((balance) => {
            if (callback) {
                callback(this.rpc.publicAddress, balance);
            }
        });
    }

    public send(toAddress: string, amount: number): Promise<string> {
        return this.rpc.send(toAddress, amount);
    }

    public getExporerURL() {
        return "https://xrpcharts.ripple.com/#/transactions/";
    }
}
