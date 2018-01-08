// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import * as React from "react";
import * as ReactDOM from "react-dom";

export class LoginCredentials {
  public readonly appPass: string;
  public readonly mnemonicPass: string;

  constructor(appPass: string, mnemonicPass: string) {
    this.appPass = appPass;
    this.mnemonicPass = mnemonicPass;
  }
}

export class Login extends React.Component<any, LoginCredentials> {
  constructor(props: any) {
    super(props);
    this.state = new LoginCredentials("the-wallet-secure-password", "");
    this.handleAppPass = this.handleAppPass.bind(this);
    this.handleMnemonicPass = this.handleMnemonicPass.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  public render() {
    return (
      <div style={{padding: "30px"}}>
        <form onSubmit={this.handleLogin}>
          <div className="form-group">
            <label>Application Password:</label>
            <input type="text" className="form-control" value={this.state.appPass} onChange={this.handleAppPass}/>
          </div>
          <div className="form-group">
            <label>Mnemonic Password:</label>
            <input type="text" className="form-control" value={this.state.mnemonicPass}
              onChange={this.handleMnemonicPass} />
          </div>
          <div className="form-actions">
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
          </div>
        </form>
      </div>
    );
  }

  private handleAppPass(event: React.FormEvent<HTMLInputElement>) {
    // http://duncanleung.com/fixing-react-warnings-synthetic-events-in-setstate/
    const target = event.target as HTMLInputElement;
    this.setState((prevState, props) => {
      return new LoginCredentials(target.value, prevState.mnemonicPass);
    });
  }

  private handleMnemonicPass(event: React.FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    this.setState((prevState, props) => {
      return new LoginCredentials(prevState.appPass, target.value);
    });
  }

  private handleLogin(event: any) {
    event.preventDefault();
    this.props.onClick(this.state);
  }
}
