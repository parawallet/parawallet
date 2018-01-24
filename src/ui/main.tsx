import * as React from "react";
import * as ReactDOM from "react-dom";
import {BtcNetworkType, BtcWallet} from "../core/btc-wallet";
import {EthNetworkType, EthWallet} from "../core/eth-wallet";
import {getOrInitializeMnemonic} from "../core/mnemonic";
import {XrpWallet} from "../core/xrp-wallet";
import {IWallet} from "../core/wallet";
import * as db from "../db/secure-db";
import {Login, LoginCredentials} from "./login";
import {Page} from "./page";

class LoginState {
    public authenticated: boolean;
    public initialized: boolean;
}

class Main extends React.Component<any, LoginState> {
    private wallets: IWallet[] = [];

    constructor(props: any) {
        super(props);
        this.state = {authenticated: false, initialized: false};
    }

    public render() {
        if (!this.state.authenticated) {
            return (<Login onClick={(login: LoginCredentials) => this.onLogin(login)}/>);
        } else if (!this.state.initialized) {
            return (
                <div style={{padding: "30px"}}>
                    ...LOADING PAGE...
                </div>
            );
        } else {
            return this.renderPage();
        }
    }

    private onLogin(loginCreds: LoginCredentials) {
        const p = db.open(loginCreds.appPass);
        p.then(() => {
            console.log("DB is ready now -> " + db.get().hasOpened);
            this.setState({authenticated: true, initialized: false});
            this.initializeWallets(loginCreds.mnemonicPass);
        }, (e: Error) => {
            console.log(e);
            alert("Wrong password: " + e);
        });
    }

    private initializeWallets(mnemonicPass: string) {
        getOrInitializeMnemonic(db.get()).then((mnemonic) => {
            const BTC = new BtcWallet(db.get(), mnemonic, mnemonicPass, BtcNetworkType.TESTNET);
            const ETH = new EthWallet(mnemonic, mnemonicPass, EthNetworkType.rinkeby);
            const XRP = new XrpWallet();
            this.wallets.push(BTC, ETH, XRP);

            const promises: Array<Promise<any>> = [];
            promises.push(BTC.initialize());
            promises.push(ETH.initialize());
            promises.push(XRP.initialize());
            Promise.all(promises).then(() => this.setState({authenticated: true, initialized: true}));
        });
    }

    private renderPage() {
        const defaultWallet = this.wallets[0];
        return (<Page defaultWalletCode={defaultWallet.code} wallets={this.wallets}/>);
    }
}

ReactDOM.render(<Main/>, document.getElementById("root"));
