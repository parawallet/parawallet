import {toast} from "react-toastify";
import * as React from "react";
import {LoginCredentials} from "../../../core/login-credentials";
import {observer} from "mobx-react";
import {observable} from "mobx";
import * as ReactTooltip from "react-tooltip";

@observer
export class CreateNewWallet extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
    private confirmAppPassInput: HTMLInputElement | null = null;
    private mnemonicPassphraseInput: HTMLInputElement | null = null;
    private confirmMnemonicPassphraseInput: HTMLInputElement | null = null;
    private showAdvancedOptionsInput: HTMLInputElement | null = null;
    @observable
    private showAdvancedOptions: boolean | null = false;

    private mnemonicPassphraseTip: string = "Mnemonic Passphrase adds a second layer of security to your crypto wallet.\n" +
        "Both the mnemonic phrase (generated 12 words) and the passphrase are required to recover the wallet.\n" +
        "If you forget passphrase you will lose all your money and wallet.";

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
                        <input type="password" className="form-control form-control-lg"
                               placeholder={"Wallet Password"}
                               ref={(input) => this.appPassInput = input}/>
                    </div>
                    <div className="form-group">
                        <input type="password" className="form-control form-control-lg"
                               placeholder={"Confirm Wallet Password"}
                               ref={(input) => this.confirmAppPassInput = input}/>
                    </div>
                    {this.showAdvancedOptions ? (
                    <div>
                        <div className="form-group">
                            <input type="password"
                                    data-tip={this.mnemonicPassphraseTip}
                                    placeholder={"Mnemonic Passphrase"}
                                    className="form-control form-control-lg"
                                    ref={(input) => this.mnemonicPassphraseInput = input}/>
                        </div>
                        <div className="form-group">
                            <input type="password" className="form-control form-control-lg"
                                    placeholder={"Confirm Mnemonic Passphrase"}
                                    ref={(input) => this.confirmMnemonicPassphraseInput = input}/>
                        </div>
                    </div>) : ""}
                    <div className="form-group text-left">
                        <div className="form-check" data-tip="Not recommended for users new to crypto space.">
                            <input type="checkbox" id="PassphraseCheckbox"
                                   className="form-control form-control-lg form-check-input"
                                   onChange={this.handleMnemonicPassphraseCheckbox}
                                   ref={(input) => this.showAdvancedOptionsInput = input}/>
                            <label className="form-check-label" htmlFor="PassphraseCheckbox"
                                   >Advanced Options</label>
                        </div>
                    </div>
                    <div className="btn-group w-75" role="group">
                        <button
                            className="btn-lg btn-light w-50"
                            onClick={this.props.reset}>
                            <i className="fas fa-arrow-left"/> Back
                        </button>
                        <button data-tip="Create the wallet!"
                                className="btn-lg btn-light w-50"
                                onClick={this.handle}>
                            <i className="fas fa-plus"/> Create
                        </button>
                    </div>
                </div>
                <ReactTooltip multiline={true} effect={"solid"} className={"w-50"}/>
            </div>
        );
    }

    public componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    private handleMnemonicPassphraseCheckbox(event: any) {
        this.showAdvancedOptions = this.showAdvancedOptionsInput && this.showAdvancedOptionsInput.checked;
    }

    private handle(event: any) {
        event.preventDefault();
        const appPass = this.appPassInput ? this.appPassInput.value : null;
        const mnemonicPassphrase = this.showAdvancedOptions && this.mnemonicPassphraseInput ? this.mnemonicPassphraseInput.value : "";

        const confirmAppPass = this.confirmAppPassInput ? this.confirmAppPassInput.value : "";
        const confirmMnemonicPassphrase = this.confirmMnemonicPassphraseInput ? this.confirmMnemonicPassphraseInput.value : "";

        if (!appPass || appPass !== confirmAppPass) {
            toast.error("Wallet passwords do not match!", {autoClose: 5000});
            return;
        }
        if (this.showAdvancedOptions && mnemonicPassphrase !== confirmMnemonicPassphrase) {
            toast.error("Mnemonic pass phrases do not match!", {autoClose: 5000});
            return;
        }
        const creds = new LoginCredentials(appPass, mnemonicPassphrase);
        this.props.handle(creds);
    }
}
