import * as React from "react";
import { toast } from "react-toastify";
import { observable } from "mobx";
import { observer } from "mobx-react";
import * as ReactTooltip from "react-tooltip";
import {LoginCredentials} from "../../../core/login-credentials";

@observer
export class Login extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
    private mnemonicPassInput: HTMLInputElement | null = null;
    private showMnemonicPassInput: HTMLInputElement | null = null;
    @observable
    private showMnemonicPass: boolean | null = false;

    constructor(props: any) {
        super(props);
        this.handle = this.handle.bind(this);
        this.showRestore = this.showRestore.bind(this);
        this.handleMnemonicPassphraseCheckbox = this.handleMnemonicPassphraseCheckbox.bind(this);
    }

    public render() {
        return (
            <div className="login-div w-100 h-100">
                <div className="text-center w-50" style={{margin: "auto"}}>
                    <img src="images/wallet_logo_inv.png" className="login-logo"/>
                    <form onSubmit={this.handle}>
                        <div className="form-group">
                            <input type="password" className="form-control form-control-lg" placeholder={"Wallet Password"}
                                   ref={(input) => this.appPassInput = input}/>
                        </div>
                        {this.showMnemonicPass ? (
                        <div className="form-group">
                            <input type="password" className="form-control form-control-lg"
                                placeholder={"Mnemonic Passphrase"}
                                ref={(input) => this.mnemonicPassInput = input}/>
                        </div>
                        ) : ""}
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
                        <div className="form-actions">
                            <input className="btn btn-lg btn-light w-100" type="submit" value="Login"/>
                        </div>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                        <div>
                            or <a href="#" className="link-dark" onClick={this.showRestore}> click to restore your wallet.</a>
                        </div>
                    </form>
                </div>
                <ReactTooltip />
            </div>
        );
    }

    private handleMnemonicPassphraseCheckbox(event: any) {
        this.showMnemonicPass = this.showMnemonicPassInput && this.showMnemonicPassInput.checked;
    }

    private handle(event: any) {
        event.preventDefault();
        const appPass = this.appPassInput ? this.appPassInput.value : "";
        if (!appPass) {
            toast.error("Wallet password is required!", {autoClose: 5000});
            return;
        }
        const mnemonicPass = this.mnemonicPassInput ? this.mnemonicPassInput.value : "";
        const creds = new LoginCredentials(appPass, mnemonicPass);
        this.props.handle(creds);
    }
    private showRestore(event: any) {
        event.preventDefault();
        this.props.showRestore();
    }
}
