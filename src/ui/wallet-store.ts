import {action, computed, observable} from "mobx";
import { Wallet } from "./wallets";

export class WalletStore {
    private readonly walletsMap = new Map<string, Wallet>();
    private readonly wallets: Wallet[];
    @observable
    private active: Wallet;

    constructor(wallets: Wallet[], activeWalletCode: string) {
        for (const w of wallets) {
            this.walletsMap.set(w.code, w);
        }
        this.wallets = wallets;
        this.active = this.getWallet(activeWalletCode);
    }

    public getWallet(walletCode: string): Wallet {
        const wa = this.walletsMap.get(walletCode);
        if (!wa) {
            throw new Error("Invalid wallet code: " + walletCode);
        }
        return wa;
    }

    @computed
    public get allWallets(): Wallet[] {
        return this.wallets;
    }

    @computed
    public get activeWallet(): Wallet {
        return this.active;
    }

    @action
    public switchWallet(walletCode: string): Wallet {
        this.active = this.getWallet(walletCode);
        return this.active;
    }
}
