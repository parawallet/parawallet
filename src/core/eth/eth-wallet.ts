import {EthWalletRpc} from "./wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "../wallet";

export enum EthNetworkType {
    mainnet, homestead, ropsten, testnet, rinkeby,
}

export class EthWallet extends AbstractWallet implements IWallet {
    private readonly rpc: EthWalletRpc;

    constructor(mnemonic: string, mnemonicPass: string, network: EthNetworkType) {
        super("ETH", "Ethereum");
        this.rpc = new EthWalletRpc(mnemonic, mnemonicPass, network);
    }

    public initialize(createEmpty: boolean) {
        return this.rpc.initialize();
    }

    public update(callback?: BalanceCallback) {
        const promise: Promise<number> = this.rpc.getBalance();
        promise.then((balance: number) => {
            if (callback) {
                callback(this.rpc.receiveAddress, balance / 1.0e18);
            }
        });
    }

    public send(toAddress: string, amount: number) {
        return this.rpc.send(toAddress, amount);
    }

    public getExporerURL() {
        return this.rpc.explorerURL;
    }
}
