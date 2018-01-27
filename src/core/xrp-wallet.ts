import {XrpWalletRpc} from "./xrp-wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";


export class XrpWallet extends AbstractWallet implements IWallet {
    private readonly rpc: XrpWalletRpc;


    constructor(mnemonic: string) {
        super("XRP", "Ripple");
        this.rpc = new XrpWalletRpc(mnemonic);
    }

    public initialize() {
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

    public send(toAddress: string, amount: number, callback?: BalanceCallback) {
        this.rpc.send(toAddress, amount, () => this.update(callback));
    }
}
