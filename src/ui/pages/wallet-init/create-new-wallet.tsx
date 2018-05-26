import {toast} from "react-toastify";
import * as React from "react";
import {defaultPassword, LoginCredentials} from "../../../core/login-credentials";

export class CreateNewWallet extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
    private confirmAppPassInput: HTMLInputElement | null = null;
    private mnemonicPassInput: HTMLInputElement | null = null;
    private confirmMnemonicPassInput: HTMLInputElement | null = null;

    constructor(props: any) {
        super(props);
        this.handle = this.handle.bind(this);
    }

    public render() {
        return (
            <div style={{padding: "30px"}}>
                <form onSubmit={this.handle}>
                    <div className="form-group">
                        <label>Application Password:</label>
                        <input type="text" className="form-control" defaultValue={defaultPassword}
                               ref={(input) => this.appPassInput = input}/>
                    </div>
                    <div className="form-group">
                        <label>Confirm Application Password:</label>
                        <input type="text" className="form-control" ref={(input) => this.confirmAppPassInput = input}/>
                    </div>
                    <div className="form-group">
                        <label>Mnemonic Password:</label>
                        <input type="text" className="form-control" ref={(input) => this.mnemonicPassInput = input}/>
                    </div>
                    <div className="form-group">
                        <label>Confirm Mnemonic Password:</label>
                        <input type="text" className="form-control"
                               ref={(input) => this.confirmMnemonicPassInput = input}/>
                    </div>
                    <div className="form-actions">
                        <input className="btn btn-large" type="submit" value="Back" onClick={this.props.reset}/>
                        <input className="btn btn-large btn-default" type="submit" value="Submit"/>
                    </div>
                </form>
            </div>
        );
    }

    private handle(event: any) {
        event.preventDefault();
        const appPass = this.appPassInput ? this.appPassInput.value : null;
        const mnemonicPass = this.mnemonicPassInput ? this.mnemonicPassInput.value : null;

        const confirmAppPass = this.confirmAppPassInput ? this.confirmAppPassInput.value : "";
        const confirmMnemonicPass = this.confirmMnemonicPassInput ? this.confirmMnemonicPassInput.value : "";

        if (!appPass || appPass !== confirmAppPass) {
            toast.error("Application passwords do not match!", {autoClose: 5000});
            return;
        }
        if (mnemonicPass !== confirmMnemonicPass) {
            toast.error("Mnemonic passwords do not match!", {autoClose: 5000});
            return;
        }

        const creds = new LoginCredentials(appPass, mnemonicPass);
        this.props.handle(creds);
    }
}
