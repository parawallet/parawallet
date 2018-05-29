import {toast} from "react-toastify";
import * as React from "react";
import {LoginCredentials} from "../../../core/login-credentials";
import * as bip39 from "bip39";
import {observer} from "mobx-react";
import {observable} from "mobx";
import * as ReactTooltip from "react-tooltip";

@observer
export class RestoreWallet extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
    private confirmAppPassInput: HTMLInputElement | null = null;
    private mnemonicInput: HTMLInputElement | null = null;
    private mnemonicPassInput: HTMLInputElement | null = null;
    private showMnemonicPassInput: HTMLInputElement | null = null;
    @observable
    private showMnemonicPass: boolean | null = false;


    constructor(props: any) {
        super(props);
        this.handle = this.handle.bind(this);
        this.handleMnemonicPassphraseCheckbox = this.handleMnemonicPassphraseCheckbox.bind(this);
    }

    public render() {
        return (
            <div className="login-div w-100 h-100">
                <div className="w-50" style={{margin: "auto"}}>
                    <img src="images/wallet_logo_inv.png" className="login-logo"/>
                    <h4>Create New Wallet</h4>
                    <br/>
                    <div className="form-group">
                        <input type="text" className="form-control form-control-lg"
                               placeholder={"Application Password"}
                               ref={(input) => this.appPassInput = input}/>
                    </div>
                    <div className="form-group">
                        <input type="text" className="form-control form-control-lg"
                               placeholder={"Confirm Application Password"}
                               ref={(input) => this.confirmAppPassInput = input}/>
                    </div>
                    <div className="form-group">
                        <input type="text" className="form-control form-control-lg"
                               placeholder={"Mnemonic"}
                               ref={(input) => this.mnemonicInput = input}/>
                    </div>
                    <div className="form-group text-left">
                        <div className="form-check" data-tip="Only needed if you had set a passphrase for mnemonic.">
                            <input type="checkbox" id="PassphraseCheckbox"
                                   className="form-control form-control-lg form-check-input"
                                   onChange={this.handleMnemonicPassphraseCheckbox}
                                   ref={(input) => this.showMnemonicPassInput = input}/>
                            <label className="form-check-label" htmlFor="PassphraseCheckbox">
                            Mnemonic Passphrase</label>
                        </div>
                    </div>
                    {this.showMnemonicPass ? (
                    <div className="form-group">
                        <input type="text" className="form-control form-control-lg"
                               placeholder={"Mnemonic Passphrase"}
                               ref={(input) => this.mnemonicPassInput = input}/>
                    </div>
                    ) : ""}
                    <div className="btn-group w-75" role="group">
                        <button
                            className="btn-lg btn-light w-50"
                            onClick={this.props.reset}>
                            <i className="fas fa-arrow-left"/> Back
                        </button>
                        <button
                            className="btn-lg btn-light w-50"
                            onClick={this.handle}>
                            <i className="fas fa-undo"/> Restore
                        </button>
                    </div>
                </div>
                <ReactTooltip />
            </div>
        );
    }

    private handleMnemonicPassphraseCheckbox(event: any) {
        this.showMnemonicPass = this.showMnemonicPassInput && this.showMnemonicPassInput.checked;
    }

    public componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    private handle(event: any) {
        event.preventDefault();

        const appPass = this.appPassInput ? this.appPassInput.value : null;
        const confirmAppPass = this.confirmAppPassInput ? this.confirmAppPassInput.value : null;

        const mnemonic = this.mnemonicInput ? this.mnemonicInput.value : "";
        const mnemonicPass = this.showMnemonicPass && this.mnemonicPassInput ? this.mnemonicPassInput.value : "";

        if (!appPass || appPass !== confirmAppPass) {
            toast.error("Application passwords do not match!", {autoClose: 5000});
            return;
        }
        if (!bip39.validateMnemonic(mnemonic)) {
            // TODO: we can allow invalid mnemonics  -- enes: why?
            toast.error("Invalid mnemonic!", {autoClose: 5000});
            return;
        }

        const creds = new LoginCredentials(appPass, mnemonicPass);
        this.props.handle(creds, mnemonic);
    }
}
