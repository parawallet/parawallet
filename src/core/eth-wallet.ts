import {EthAddressGenerator} from "./eth-address-gen";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";

export class EthWallet extends AbstractWallet implements IWallet {
    private addressGen: EthAddressGenerator;


    constructor(addressGen: EthAddressGenerator) {
        super("ETH", "Ethereum");
        this.addressGen = addressGen;
    }

    public update(callback?: BalanceCallback) {
        this.totalBalance = 0;
        if (callback) {
            callback("", 0);
        }
    }

    public send(toAddress: string, amount: number) {
        alert("wallet not available");
    }
}
