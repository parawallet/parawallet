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

enum NextState {
    AUTH,
    SETUP_2FA,
    INIT_WALLETS,
    SHOW_MAIN_PAGE,
}

@observer
class Main extends React.Component<any, any> {
    private wallets: Wallet[] = [];
    private credentials: LoginCredentials;
    private loginType: LoginType;
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
                        ... LOADING PAGE ... INITIALIZING ...
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
                this.next = NextState.SETUP_2FA;
            } else {
                this.next = NextState.INIT_WALLETS;
                this.initializeWallets(loginCreds.mnemonicPass, false);
            }
        }).catch((e: Error) => {
            console.log(e);
            toast.error("Wrong password!", {position: toast.POSITION.TOP_CENTER});
        });
    }

    private initializeWallets(mnemonicPass: string, createEmpty: boolean) {
        const kv = DB.get(C.WALLET_DB)!;
        getOrInitializeMnemonic(kv).then((mnemonic) => {
            toast.info("Please write down following words to backup your wallet: " + mnemonic);

            const BTC = new BtcWallet(kv, mnemonic, mnemonicPass, BtcNetworkType.TESTNET);
            const ETH = new EthWallet(kv, mnemonic, mnemonicPass, EthNetworkType.rinkeby);
            const XRP = new XrpWallet(kv, mnemonic, mnemonicPass, XrpNetworkType.TEST);
            this.wallets.push(BTC, ETH, XRP);

            const promises: Array<Promise<any>> = [];
            promises.push(BTC.initialize(createEmpty));
            promises.push(ETH.initialize(createEmpty));
            promises.push(XRP.initialize(createEmpty));
            Promise.all(promises).then(() => this.next = NextState.SHOW_MAIN_PAGE);
        });
    }

    private renderPage() {
        const defaultWallet = this.wallets[0];
        return (<Page defaultWalletCode={defaultWallet.code} wallets={this.wallets}/>);
    }
}

ReactDOM.render(<Main />, document.getElementById("root"));
