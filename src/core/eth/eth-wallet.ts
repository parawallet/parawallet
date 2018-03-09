import {EthWalletRpc} from "./wallet-rpc";
import {AbstractWallet, Balance, Wallet} from "../wallet";

export enum EthNetworkType {
    mainnet, homestead, ropsten, testnet, rinkeby,
}

export class EthWallet extends AbstractWallet implements Wallet {
    private readonly rpc: EthWalletRpc;

    constructor(mnemonic: string, mnemonicPass: string, network: EthNetworkType) {
        super("ETH", "Ethereum");
        this.rpc = new EthWalletRpc(mnemonic, mnemonicPass, network);
    }

    public initialize(createEmpty: boolean) {
        return this.rpc.initialize();
    }

    public addresses(): string[] {
        return [this.rpc.receiveAddress];
    }

    public totalBalance() {
        const promise: Promise<number> = this.rpc.getBalance();
        return promise.then((balance: number) => balance / 1.0e18);
    }

    public detailedBalance() {
        const promise: Promise<number> = this.rpc.getBalance();
        return promise.then((balance: number) => [{address: this.rpc.receiveAddress, amount: balance / 1.0e18}]);
    }

    public send(toAddress: string, amount: number) {
        return this.rpc.send(toAddress, amount);
    }

    public getExporerURL() {
        return this.rpc.explorerURL;
    }
}
