import {XrpWalletRpc} from "./xrp-wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";


export class XrpWallet extends AbstractWallet implements IWallet {
    private readonly rpc: XrpWalletRpc;

    constructor(mnemonic: string) {
        super("XRP", "Ripple");
        this.rpc = new XrpWalletRpc(mnemonic);
    }

    public initialize(newWallet: boolean) {
        return this.rpc.initialize();
    }

    public update(callback?: BalanceCallback) {
        const promise: Promise<number> = this.rpc.getBalance();
        promise.then((balance: number) => {
            if (callback) {
                callback(this.rpc.address, balance);
            }
        });
    }

    public send(toAddress: string, amount: number, callback: any) {
        this.rpc.send(toAddress, amount, (txnid: string) => {
                callback("https://xrpcharts.ripple.com/#/transactions/", txnid);
            },
        );
    }
}
