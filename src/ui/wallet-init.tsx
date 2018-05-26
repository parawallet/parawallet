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

@observer
export class WalletInit extends React.Component<any, any> {
    @observable
    private shouldShowCreateNewDialog: boolean = false;
    @observable
    private shouldShowImportDialog: boolean = false;

    constructor(props: any) {
        super(props);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleCreateNew = this.handleCreateNew.bind(this);
        this.handleImport = this.handleImport.bind(this);
    }

    public render() {
        if (DB.exists(C.WALLET_DB)) {
            return (
                <Login handle={this.handleLogin}/>
            );
        } else if (this.shouldShowCreateNewDialog) {
            return (
                <CreateNewWallet handle={this.handleCreateNew} reset={this.reset}/>
            );
        } else if (this.shouldShowImportDialog) {
            return (
                <RestoreWallet handle={this.handleImport} reset={this.reset}/>
            );
        } else {
            return this.renderInit();
        }
    }

    private renderInit() {
        return (
            <div style={{padding: "30px"}}>
                <div className="form-actions">
                    <input className="btn btn-large" type="button" value="Create New Wallet"
                           onClick={this.showCreateNewDialog}/>
                    <input className="btn btn-large btn-default" type="button" value="Import Wallet"
                           onClick={this.showImportDialog}/>
                </div>
            </div>
        );
    }

    @action.bound
    private showCreateNewDialog() {
        this.shouldShowCreateNewDialog = true;
        this.shouldShowImportDialog = false;
    }

    @action.bound
    private showImportDialog() {
        this.shouldShowCreateNewDialog = false;
        this.shouldShowImportDialog = true;
    }

    @action.bound
    private reset() {
        this.shouldShowCreateNewDialog = false;
        this.shouldShowImportDialog = false;
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

    private async handleImport(credentials: LoginCredentials, mnemonic: string) {
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
