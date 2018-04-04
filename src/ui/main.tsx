import { observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ToastContainer, toast } from "react-toastify";
import * as C from "../constants";
import * as DB from "../db/secure-db";
import {Login, LoginCredentials, LoginType} from "./login";
import {Page} from "./page";
import { TotpSetup, totpValidator } from "./totp";
import {BtcNetworkType, BtcWallet,
    EthNetworkType, EthWallet,
    getOrInitializeMnemonic, Wallet, XrpNetworkType, XrpWallet} from "./wallets";
import {PortfolioStore} from "../core/portfolio";


enum NextState {
    AUTH,
    SETUP_2FA,
    INIT_WALLETS,
    INIT_PORTFOLIO,
    SHOW_MAIN_PAGE,
}

@observer
class Main extends React.Component<any, any> {
    private wallets: Wallet[] = [];
    private credentials: LoginCredentials;
    private loginType: LoginType;
    private portfolioStore: PortfolioStore;
    @observable
    private next = NextState.AUTH;

    constructor(props: any) {
        super(props);
        this.onValidToken = this.onValidToken.bind(this);
    }

    public render() {
        return [this.renderNext(),
            (<ToastContainer position={toast.POSITION.TOP_CENTER} autoClose={false} hideProgressBar={true} />)];
    }

    private renderNext() {
        switch (this.next) {
            case NextState.AUTH:
                return (<Login onLogin={(login: LoginCredentials, loginType: LoginType) => this.onLogin(login, loginType)}/>);
            case NextState.SETUP_2FA:
                return (<TotpSetup onValidToken={this.onValidToken} />);
            case NextState.INIT_WALLETS:
                return (
                    <div style={{padding: "30px"}}>
                        ... LOADING PAGE ... INITIALIZING WALLETS...
                    </div>
                );
            case NextState.INIT_PORTFOLIO:
                return (
                    <div style={{padding: "30px"}}>
                        ... LOADING PAGE ... INITIALIZING PORTFOLIO...
                    </div>
                );
            case NextState.SHOW_MAIN_PAGE:
                return this.renderPage();
        }
    }

    private onValidToken() {
        this.next = NextState.INIT_WALLETS;
        this.initializeWallets(this.credentials.mnemonicPass, this.loginType === LoginType.NEW);
    }

    private async onLogin(loginCreds: LoginCredentials, loginType: LoginType) {
        this.credentials = loginCreds;
        this.loginType = loginType;

        try {
            const walletKv = await DB.open(C.WALLET_DB, loginCreds.appPass);
            const configKv = await DB.open(C.CONFIG_DB, loginCreds.appPass);
            totpValidator.restore(configKv!);
            console.log("DB is ready now -> " + walletKv!.hasOpened);
            if (loginType === LoginType.NEW || loginType === LoginType.IMPORT) {
                this.next = NextState.SETUP_2FA;
            } else {
                this.next = NextState.INIT_WALLETS;
                this.initializeWallets(loginCreds.mnemonicPass, false);
            }
        } catch (error) {
            console.log(error);
            toast.error("Wrong password!", {position: toast.POSITION.TOP_CENTER});
        }
    }

    private async initializeWallets(mnemonicPass: string, createEmpty: boolean) {
        const kv = DB.get(C.WALLET_DB)!;
        const mnemonic = await getOrInitializeMnemonic(kv);

        toast.info("Please write down following words to backup your wallet: " + mnemonic);

        const BTC = new BtcWallet(kv, mnemonic, mnemonicPass, BtcNetworkType.TESTNET);
        const ETH = new EthWallet(kv, mnemonic, mnemonicPass, EthNetworkType.rinkeby);
        const XRP = new XrpWallet(kv, mnemonic, mnemonicPass, XrpNetworkType.TEST);
        this.wallets.push(BTC, ETH, XRP);

        const promises = this.wallets.map((w) => w.initialize(createEmpty));
        await Promise.all(promises);
        this.next = NextState.INIT_PORTFOLIO;
        await this.initializePortfolio();
    }

    private async initializePortfolio() {
        const kv = DB.get(C.WALLET_DB);
        const mnemonic = "cv ";
        const mnemonicPass = "cv ";
        this.portfolioStore = new PortfolioStore();
        await this.portfolioStore.getAndUpdatePortfolioHistory(this.wallets);
        this.next = NextState.SHOW_MAIN_PAGE;
    }

    private renderPage() {
        const defaultWallet = this.wallets[0];
        return (<Page defaultWalletCode={defaultWallet.code} wallets={this.wallets} portfolioStore={this.portfolioStore} />);
    }
}

ReactDOM.render(<Main />, document.getElementById("root"));
