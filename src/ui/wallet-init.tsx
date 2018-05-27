import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {toast} from "react-toastify";
import * as C from "../constants";
import {restoreMnemonic, validateMnemonic} from "../core/mnemonic";
import * as DB from "../util/secure-db";
import {stringifyErrorMessageReplacer} from "../util/errors";
import {Login} from "./pages/wallet-init/login";
import {LoginCredentials} from "../core/login-credentials";
import {CreateNewWallet} from "./pages/wallet-init/create-new-wallet";
import {RestoreWallet} from "./pages/wallet-init/restore-wallet";


export enum WalletInitType {
    NEW,
    IMPORT,
    EXISTING,
}

export enum WalletInitPage {
    NEW_WALLET,
    RESTORE_WALLET,
}

@observer
export class WalletInit extends React.Component<any, any> {
    @observable
    private activePage: WalletInitPage | null;

    constructor(props: any) {
        super(props);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleCreateNew = this.handleCreateNew.bind(this);
        this.handleRestore = this.handleRestore.bind(this);
        this.showRestoreDialog = this.showRestoreDialog.bind(this);
    }

    public render() {
        if (this.activePage === WalletInitPage.NEW_WALLET) {
            return (
                <CreateNewWallet handle={this.handleCreateNew} reset={this.reset}/>
            );
        } else if (this.activePage === WalletInitPage.RESTORE_WALLET) {
            return (
                <RestoreWallet handle={this.handleRestore} reset={this.reset}/>
            );
        }

        if (DB.exists(C.WALLET_DB)) {
            return (
                <Login handle={this.handleLogin} showRestore={this.showRestoreDialog}/>
            );
        } else {
            return this.renderInit();
        }
    }

    private renderInit() {
        return (
            <div className="login-div w-100 h-100">
                <div className="text-center w-50" style={{margin: "auto"}}>
                    <img src="images/wallet_logo_inv.png" className="login-logo"/>
                    <div>
                        <button type="button"
                                className="btn-lg btn-light w-75"
                                onClick={this.showCreateNewDialog}>
                            <i className="fas fa-plus"/> Create New Wallet
                        </button>
                    </div>
                    <br/>
                    <div>
                        <button type="button" data-tip="Restore your wallet by entering 12 words mnemonics."
                                className="btn-lg btn-light w-75"
                                onClick={this.showRestoreDialog}>
                            <i className="fas fa-undo"/> Restore Your Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    @action.bound
    private showCreateNewDialog() {
        this.activePage = WalletInitPage.NEW_WALLET;
    }

    @action.bound
    private showRestoreDialog() {
        this.activePage = WalletInitPage.RESTORE_WALLET;
    }

    @action.bound
    private reset() {
        this.activePage = null;
    }

    private async handleCreateNew(credentials: LoginCredentials) {
        try {
            await DB.open(C.WALLET_DB, credentials.appPass);
            this.reset();
            this.props.onLogin(credentials, WalletInitType.NEW);
        } catch (error) {
            toast.error(JSON.stringify(error, stringifyErrorMessageReplacer));
        }
    }

    private async handleRestore(credentials: LoginCredentials, mnemonic: string) {
        try {
            if (!validateMnemonic(mnemonic)) {
                toast.warn("Given mnemonic is not a valid mnemonic!");
            }
            const walletKv = await DB.open(C.WALLET_DB, credentials.appPass);
            restoreMnemonic(mnemonic, walletKv!);
            this.reset();
            this.props.onLogin(credentials, WalletInitType.IMPORT);
        } catch (error) {
            toast.error(JSON.stringify(error, stringifyErrorMessageReplacer));
        }
    }

    private handleLogin(credentials: LoginCredentials) {
        this.props.onLogin(credentials, WalletInitType.EXISTING);
    }
}
