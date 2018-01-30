import * as React from "react";
import * as ReactDOM from "react-dom";
import * as C from "../constants";
import * as DB from "../db/secure-db";
import {Login, LoginCredentials, LoginType} from "./login";
import {Page} from "./page";
import { TotpSetup, totpValidator } from "./totp";
import {BtcNetworkType, BtcWallet,
    EthNetworkType, EthWallet,
    getOrInitializeMnemonic, IWallet, XrpWallet} from "./wallets";

enum NextState {
    AUTH,
    SETUP_2FA,
    INIT_WALLETS,
    SHOW_MAIN_PAGE,
}

class Main extends React.Component<any, any> {
    private wallets: IWallet[] = [];
    private credentials: LoginCredentials;
    private loginType: LoginType;

    constructor(props: any) {
        super(props);
        this.state = {next: NextState.AUTH};
        this.onValidToken = this.onValidToken.bind(this);
    }

    public render() {
        switch (this.state.next) {
            case NextState.AUTH:
                return (<Login onClick={(login: LoginCredentials, loginType: LoginType) => this.onLogin(login, loginType)}/>);
            case NextState.SETUP_2FA:
                return (<TotpSetup onValidToken={this.onValidToken} />);
            case NextState.INIT_WALLETS:
                return (
                    <div style={{padding: "30px"}}>
                        ... LOADING PAGE ... INITIALIZING ...
                    </div>
                );
            case NextState.SHOW_MAIN_PAGE:
                return this.renderPage();
        }
    }

    private onValidToken() {
        this.setState({next: NextState.INIT_WALLETS},
            () => this.initializeWallets(this.credentials.mnemonicPass, this.loginType === LoginType.NEW));
    }

    private onLogin(loginCreds: LoginCredentials, loginType: LoginType) {
        this.credentials = loginCreds;
        this.loginType = loginType;
        const p = DB.open(C.WALLET_DB, loginCreds.appPass).then(() => {
            return DB.open(C.CONFIG_DB, loginCreds.appPass).then(() => {
                totpValidator.restore(DB.get(C.CONFIG_DB)!);
            });
        });

        p.then(() => {
            console.log("DB is ready now -> " + DB.get(C.WALLET_DB)!.hasOpened);
            if (loginType === LoginType.NEW || loginType === LoginType.IMPORT) {
                this.setState({next: NextState.SETUP_2FA});
            } else {
                this.setState({next: NextState.INIT_WALLETS},
                    () => this.initializeWallets(loginCreds.mnemonicPass, false));
            }
        }, (e: Error) => {
            console.log(e);
            alert("Wrong password: " + e);
        });
    }

    private initializeWallets(mnemonicPass: string, isNewWallet: boolean) {
        const kv = DB.get(C.WALLET_DB)!;
        getOrInitializeMnemonic(kv).then((mnemonic) => {
            const BTC = new BtcWallet(kv, mnemonic, mnemonicPass, BtcNetworkType.TESTNET);
            const ETH = new EthWallet(mnemonic, mnemonicPass, EthNetworkType.rinkeby);
            const XRP = new XrpWallet(mnemonic);
            this.wallets.push(BTC, ETH, XRP);

            const promises: Array<Promise<any>> = [];
            promises.push(BTC.initialize(isNewWallet));
            promises.push(ETH.initialize(isNewWallet));
            promises.push(XRP.initialize(isNewWallet));
            Promise.all(promises).then(() => this.setState({next: NextState.SHOW_MAIN_PAGE}));
        });
    }

    private renderPage() {
        const defaultWallet = this.wallets[0];
        return (<Page defaultWalletCode={defaultWallet.code} wallets={this.wallets}/>);
    }
}

ReactDOM.render(<Main/>, document.getElementById("root"));
