import { observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ToastContainer, toast } from "react-toastify";
import * as C from "../constants";
import * as DB from "../util/secure-db";
import {Login, LoginCredentials, LoginType} from "./login";
import {Page} from "./page";
import { TotpSetup, totpValidator } from "./totp";
import { getOrInitializeMnemonic, Wallet, XrpWallet, EthWallet, BtcWallet,
    BtcNetworkType, EthNetworkType, XrpNetworkType } from "./wallets";
import {PortfolioStore} from "../core/portfolio";

enum PageId {
    AUTH,
    SETUP_2FA,
    LOADING,
    MAIN_PAGE,
}

@observer
class Main extends React.Component<any, any> {
    private wallets: Wallet[] = [];
    private credentials: LoginCredentials;
    private loginType: LoginType;
    private mnemonic: string;
    private portfolioStore: PortfolioStore;
    @observable
    private activePage = PageId.AUTH;

    constructor(props: any) {
        super(props);
        this.onValidToken = this.onValidToken.bind(this);
    }

    public render() {
        return [this.renderActivePage(),
            (<ToastContainer position={toast.POSITION.TOP_CENTER} autoClose={false} hideProgressBar={true} key="toast" />)];
    }

    private renderActivePage() {
        switch (this.activePage) {
            case PageId.AUTH:
                return (<Login onLogin={(login: LoginCredentials, loginType: LoginType) => this.onLogin(login, loginType)} key="login" />);
            case PageId.SETUP_2FA:
                return (<TotpSetup onValidToken={this.onValidToken} key="totp" />);
            case PageId.LOADING:
                return (
                    <div className="paneContentDiv" key="loading">
                        <h3>INIT</h3>
                        <hr/>
                        <span className="important_note">... LOADING PAGE ...</span>
                    </div>
                );
            case PageId.MAIN_PAGE:
                return this.renderPage();
        }
    }

    private onValidToken() {
        this.activePage = PageId.LOADING;
        this.initializeWallets(this.credentials.mnemonicPass, this.loginType === LoginType.NEW);
    }

    private async onLogin(loginCreds: LoginCredentials, loginType: LoginType) {
        this.activePage = PageId.LOADING;
        this.credentials = loginCreds;
        this.loginType = loginType;
        try {
            const walletKv = await DB.open(C.WALLET_DB, loginCreds.appPass);
            const configKv = await DB.open(C.CONFIG_DB, loginCreds.appPass);
            console.log("Databases are ready now");

            totpValidator.restore(configKv!);
            if (loginType === LoginType.NEW || loginType === LoginType.IMPORT) {
                this.activePage = PageId.SETUP_2FA;
            } else {
                this.activePage = PageId.LOADING;
                this.initializeWallets(loginCreds.mnemonicPass, false);
            }
        } catch (error) {
            console.log(error);
            toast.error("Wrong password!", {position: toast.POSITION.TOP_CENTER});
        }
    }

    private async initializeWallets(mnemonicPass: string, createEmpty: boolean) {
        const kv = DB.get(C.WALLET_DB)!;
        this.mnemonic = await getOrInitializeMnemonic(kv);

        if (this.loginType === LoginType.NEW) {
            toast.info("Please write down following words to backup your wallet: " + this.mnemonic);
        }

        const BTC = new BtcWallet(kv, this.mnemonic, mnemonicPass, BtcNetworkType.TESTNET);
        const ETH = new EthWallet(kv, this.mnemonic, mnemonicPass, EthNetworkType.rinkeby);
        const XRP = new XrpWallet(kv, this.mnemonic, mnemonicPass, XrpNetworkType.TEST);
        this.wallets.push(BTC, ETH, XRP);

        const promises = this.wallets.map((w) => w.initialize(createEmpty));
        await Promise.all(promises);

        this.activePage = PageId.LOADING;
        this.initializePortfolio();
    }

    private async initializePortfolio() {
        this.portfolioStore = new PortfolioStore(this.wallets);
        await this.portfolioStore.initializeOrUpdatePortfolioHistory();
        this.activePage = PageId.MAIN_PAGE;
    }

    private renderPage() {
        const defaultWallet = this.wallets[0];
        return (<Page defaultWalletCode={defaultWallet.code} wallets={this.wallets} portfolioStore={this.portfolioStore} mnemonics={this.mnemonic} key="page"/>);
    }
}

ReactDOM.render(<Main />, document.getElementById("root"));
