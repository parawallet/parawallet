import * as React from "react";
import {defaultPassword, LoginCredentials} from "../../../core/login-credentials";


export class Login extends React.Component<any, any> {
    private appPassInput: HTMLInputElement | null = null;
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
                    <form onSubmit={this.handle}>
                        <div className="form-group">
                            <input type="text" className="form-control form-control-lg" placeholder={"Password"}
                                   defaultValue={defaultPassword}
                                   ref={(input) => this.appPassInput = input}/>
                        </div>
                        <div className="form-group">
                            <input type="text" className="form-control form-control-lg"
                                   placeholder={"Mnemonic Salt"}
                                   ref={(input) => this.mnemonicPassInput = input}/>
                        </div>
                        <div className="form-actions">
                            <input className="btn btn-lg btn-light w-50" type="submit" value="Login"/>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    private handle(event: any) {
        event.preventDefault();
        const appPass = this.appPassInput ? this.appPassInput.value : "";
        const mnemonicPass = this.mnemonicPassInput ? this.mnemonicPassInput.value : "";
        const creds = new LoginCredentials(appPass, mnemonicPass);
        this.props.handle(creds);
    }
}
