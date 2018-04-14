import {action, computed, observable} from "mobx";
import {Wallet, Balance} from "../core/wallet";

export class WalletAccount {

    public readonly wallet: Wallet;
    @observable
    private balances: Balance[] = [];

    constructor(wallet: Wallet) {
        this.wallet = wallet;
    }

    @computed
    public get isEmpty(): boolean {
        return this.balances.length === 0;
    }

    @computed
    public get detailedBalances(): ReadonlyArray<Balance> {
        return this.balances;
    }

    @computed
    public get totalBalance(): number {
        let total = 0;
        this.balances.forEach((balance) => {
            total += balance.amount;
        });
        return total;
    }

    @action
    public async update() {
        const balances = await this.wallet.detailedBalances();
        this.balances = balances;
    }
}

export class WalletStore {
    private readonly walletAccounts = new Map<string, WalletAccount>();
    @observable
    private activeWalletAccount: WalletAccount;

    constructor(wallets: Wallet[], activeWalletCode: string) {
        for (const w of wallets) {
            this.walletAccounts.set(w.code, new WalletAccount(w));
        }
        this.activeWalletAccount = this.getWalletAccount(activeWalletCode);
    }

    public getWalletAccount(walletCode: string): WalletAccount {
        const wa = this.walletAccounts.get(walletCode);
        if (!wa) {
            throw new Error("Invalid wallet code: " + walletCode);
        }
        return wa;
    }

    @computed
    public get allAccounts(): WalletAccount[] {
        return Array.from(this.walletAccounts.values());
    }

    @computed
    public get activeAccount(): WalletAccount {
        return this.activeWalletAccount;
    }

    public updateWalletAccounts() {
        this.walletAccounts.forEach( (wallet: WalletAccount) => {
            wallet.update();
        });
    }

    @action
    public switchWallet(walletCode: string): WalletAccount {
        this.activeWalletAccount = this.getWalletAccount(walletCode);
        return this.activeWalletAccount;
    }
}
