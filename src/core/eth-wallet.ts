import {EthAddressGenerator} from "./eth-address-gen";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";

export class EthWallet extends AbstractWallet implements IWallet {
    private addressGen: EthAddressGenerator;


    constructor(addressGen: EthAddressGenerator) {
        super("ETH", "Ethereum");
        this.addressGen = addressGen;
    }

    public update(callback?: BalanceCallback) {
        const promise: Promise<number> = this.addressGen.getBalance();
        promise.then((balance: number) => {
            if (callback) {
                callback(this.addressGen.receiveAddress, balance / 1.0e18);
            }
        });
    }

    public send(toAddress: string, amount: number, callback?: BalanceCallback) {
        this.addressGen.send(toAddress, amount, () => this.update(callback));
    }
}
