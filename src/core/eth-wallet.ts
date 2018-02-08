import {EthWalletRpc} from "./eth-wallet-rpc";
import {AbstractWallet, BalanceCallback, IWallet} from "./wallet";

export enum EthNetworkType {
    mainnet, homestead, ropsten, testnet, rinkeby,
}

export class EthWallet extends AbstractWallet implements IWallet {
    private readonly rpc: EthWalletRpc;

    constructor(mnemonic: string, mnemonicPass: string, network: EthNetworkType) {
        super("ETH", "Ethereum");
        this.rpc = new EthWalletRpc(mnemonic, mnemonicPass, network);
    }

    public initialize(isNewWallet: boolean) {
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

    public send(toAddress: string, amount: number, callback: any) {
        this.rpc.send(toAddress, amount, (transactionHash: string) => {
            // todo move the static url to network type
            callback("https://rinkeby.etherscan.io/tx/", transactionHash);
        });
    }
}
