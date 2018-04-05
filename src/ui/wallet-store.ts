import {action, computed, observable} from "mobx";
import {Wallet, Balance} from "../core/wallet";
import {PortfolioStore} from "../core/portfolio";


export class WalletAccount {

    public readonly wallet: Wallet;
    public readonly portfolioStore: PortfolioStore;
    @observable
    private balances: Balance[] = [];

    constructor(wallet: Wallet, portfolioStore: PortfolioStore) {
        this.wallet = wallet;
        this.portfolioStore = portfolioStore;
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
        // find more efficient way of comparing arrays
        const updatePortfolio: boolean = JSON.stringify(balances) !== JSON.stringify(this.balances);
        this.balances = balances;
        if (updatePortfolio) {
            this.portfolioStore.updateLastRecord();
        }
    }
}

export class WalletStore {
    private readonly walletAccounts = new Map<string, WalletAccount>();
    @observable
    private activeWalletAccount: WalletAccount;

    constructor(wallets: Wallet[], activeWalletCode: string, portfolioStore: PortfolioStore) {
        for (const w of wallets) {
            this.walletAccounts.set(w.code, new WalletAccount(w, portfolioStore));
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
    public get activeAccount(): WalletAccount {
        return this.activeWalletAccount;
    }

    @action
    public switchWallet(walletCode: string): WalletAccount {
        this.activeWalletAccount = this.getWalletAccount(walletCode);
        return this.activeWalletAccount;
    }
}
