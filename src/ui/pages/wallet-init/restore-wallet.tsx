import {toast} from "react-toastify";
import * as React from "react";
import * as bip39 from "bip39";
import {observer} from "mobx-react";
import {observable} from "mobx";
import * as ReactTooltip from "react-tooltip";
import {confirmAlert} from "react-confirm-alert";
import {LoginCredentials} from "../../../core/login-credentials";
import * as C from "../../../constants";
import * as DB from "../../../util/secure-db";


enum RestorePhase {
    enterMnemonic, enterWalletPassword,
}

@observer
export class RestoreWallet extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
    private confirmAppPassInput: HTMLInputElement | null = null;
    private mnemonicInput: HTMLTextAreaElement | null = null;
    private mnemonicPassInput: HTMLInputElement | null = null;
    private showMnemonicPassInput: HTMLInputElement | null = null;
    private mnemonic: string;
    private mnemonicPass: string;
    @observable
    private showMnemonicPass: boolean | null = false;
    @observable
    private restorePhase: RestorePhase = RestorePhase.enterMnemonic;


    constructor(props: any) {
        super(props);
        this.handleEnterMnemonic = this.handleEnterMnemonic.bind(this);
        this.handleEnterPassword = this.handleEnterPassword.bind(this);
        this.handleMnemonicPassphraseCheckbox = this.handleMnemonicPassphraseCheckbox.bind(this);
    }

    public render() {
        if (this.restorePhase === RestorePhase.enterMnemonic) {
            return (
                <div className="login-div w-100 h-100">
                    <div className="w-50" style={{margin: "auto"}}>
                        <img src="images/wallet_logo_inv.png" className="login-logo"/>
                        <h4>Restore Your Wallet</h4>
                        <br/>
                        <div className="form-group">
                            <textarea className="form-control form-control-lg" rows={3}
                                      placeholder={"Enter mnemonic (12 words) with space between each word"}
                                      ref={(input) => this.mnemonicInput = input}  />
                        </div>
                        {this.showMnemonicPass ? (
                            <div className="form-group">
                                <input type="password" className="form-control form-control-lg"
                                       placeholder={"Mnemonic Passphrase"}
                                       ref={(input) => this.mnemonicPassInput = input}/>
                            </div>
                        ) : ""}
                        <div className="form-group text-left">
                            <div className="form-check"
                                 data-tip="Only needed if you had set a passphrase for mnemonic.">
                                <input type="checkbox" id="PassphraseCheckbox"
                                       className="form-control form-control-lg form-check-input"
                                       onChange={this.handleMnemonicPassphraseCheckbox}
                                       ref={(input) => this.showMnemonicPassInput = input}/>
                                <label className="form-check-label" htmlFor="PassphraseCheckbox">
                                    Mnemonic Passphrase</label>
                            </div>
                        </div>
                        <div className="btn-group w-75" role="group">
                            <button
                                className="btn-lg btn-light w-50"
                                onClick={this.props.reset}>
                                <i className="fas fa-arrow-left"/> Back
                            </button>
                            <button
                                className="btn-lg btn-light w-50"
                                onClick={this.handleEnterMnemonic}>
                                <i className="fas fa-angle-double-right"/> Next
                            </button>
                        </div>
                    </div>
                    <ReactTooltip/>
                </div>
            );
        } else if (this.restorePhase === RestorePhase.enterWalletPassword) {
            return (
                <div className="login-div w-100 h-100">
                    <div className="w-50" style={{margin: "auto"}}>
                        <img src="images/wallet_logo_inv.png" className="login-logo"/>
                        <h4>Restore Your Wallet</h4>
                        <br/>
                        <div className="form-group">
                            <input type="password" className="form-control form-control-lg"
                                   placeholder={"Create a new wallet password"}
                                   ref={(input) => this.appPassInput = input}/>
                        </div>
                        <div className="form-group">
                            <input type="password" className="form-control form-control-lg"
                                   placeholder={"Confirm wallet password"}
                                   ref={(input) => this.confirmAppPassInput = input}/>
                        </div>
                        <div className="btn-group w-75" role="group">
                            <button
                                className="btn-lg btn-light w-50"
                                onClick={this.props.reset}>
                                <i className="fas fa-arrow-left"/> Back
                            </button>
                            <button
                                className="btn-lg btn-light w-50"
                                onClick={this.handleEnterPassword}>
                                <i className="fas fa-undo"/> Restore
                            </button>
                        </div>
                    </div>
                    <ReactTooltip/>
                </div>
            );
        }

    }

    private handleMnemonicPassphraseCheckbox(event: any) {
        this.showMnemonicPass = this.showMnemonicPassInput && this.showMnemonicPassInput.checked;
    }

    public componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    private handleEnterMnemonic(event: any) {
        event.preventDefault();

        const mnemonic = this.mnemonicInput ? this.mnemonicInput.value : "";
        const mnemonicPass = this.showMnemonicPass && this.mnemonicPassInput ? this.mnemonicPassInput.value : "";
        if (!bip39.validateMnemonic(mnemonic)) {
            // TODO: we can allow invalid mnemonics
            toast.error("Invalid mnemonic!", {autoClose: 5000});
            return;
        }
        this.goToPasswordPhase(mnemonic, mnemonicPass);
    }

    private goToPasswordPhase(mnemonic: string, mnemonicPass: string) {
        this.mnemonic = mnemonic;
        this.mnemonicPass = mnemonicPass;
        this.restorePhase = RestorePhase.enterWalletPassword;
    }

    private handleEnterPassword(event: any) {
        event.preventDefault();

        const appPass = this.appPassInput ? this.appPassInput.value : null;
        const confirmAppPass = this.confirmAppPassInput ? this.confirmAppPassInput.value : null;

        if (!appPass || appPass !== confirmAppPass) {
            toast.error("Application passwords do not match!", {autoClose: 5000});
            return;
        }

        if (DB.exists(C.WALLET_DB)) {
            confirmAlert({
                buttons: [
                    {label: "Yes", onClick: () => this.restore(appPass)},
                    {label: "Cancel", onClick: () => this.props.reset()},
                ],
                message: "You will lose all existing data during restore.",
                title: "Are you sure to overwrite existing wallet?",
            });
        } else {
            this.restore(appPass);
        }
    }

    private restore(appPass: string) {
        DB.unlink(C.WALLET_DB);
        DB.unlink(C.CONFIG_DB);
        const creds = new LoginCredentials(appPass, this.mnemonicPass);
        this.props.handle(creds, this.mnemonic);
    }
}
