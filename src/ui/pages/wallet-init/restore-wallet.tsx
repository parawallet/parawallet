import {toast} from "react-toastify";
import * as React from "react";
import {defaultPassword, LoginCredentials} from "../../../core/login-credentials";
import * as bip39 from "bip39";

export class RestoreWallet extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
    private confirmAppPassInput: HTMLInputElement | null = null;
    private mnemonicInput: HTMLInputElement | null = null;
    private mnemonicPassInput: HTMLInputElement | null = null;

    constructor(props: any) {
        super(props);
        this.handle = this.handle.bind(this);
    }

    public render() {
        return (
            <div className="login-div w-100 h-100">
                <div className="text-center w-50" style={{margin: "auto"}}>
                    <img src="images/wallet_logo_inv.png" className="login-logo"/>
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
                    <div className="form-group">
                        <input type="text" className="form-control form-control-lg"
                               placeholder={"Mnemonic Salt"}
                               ref={(input) => this.mnemonicPassInput = input}/>
                    </div>

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
            </div>
        );
    }

    private handle(event: any) {
        event.preventDefault();

        const appPass = this.appPassInput ? this.appPassInput.value : null;
        const confirmAppPass = this.confirmAppPassInput ? this.confirmAppPassInput.value : null;

        const mnemonic = this.mnemonicInput ? this.mnemonicInput.value : "";
        const mnemonicPass = this.mnemonicPassInput ? this.mnemonicPassInput.value : "";

        if (!appPass || appPass !== confirmAppPass) {
            toast.error("Application passwords do not match!", {autoClose: 5000});
            return;
        }
        if (!bip39.validateMnemonic(mnemonic)) {
            // TODO: we can allow invalid mnemonics
            toast.error("Invalid mnemonic!", {autoClose: 5000});
            return;
        }

        const creds = new LoginCredentials(appPass, mnemonicPass);
        this.props.handle(creds, mnemonic);
    }
}
