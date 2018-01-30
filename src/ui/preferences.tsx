import * as React from "react";
import * as Modal from "react-modal";
import { TotpRemove, TotpSetup, totpValidator } from "./totp";

export class PreferencesMenu extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  public render() {
    return (
      <nav className="nav-group">
        <h5 className="nav-group-title"><a onClick={this.props.onClick}>Settings</a></h5>
      </nav>
    );
  }
}


export class Preferences extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.resetState = this.resetState.bind(this);
    this.handle2FA = this.handle2FA.bind(this);
    this.state = {showTotpSetup: false, showRemoveTotp: false};
  }

  public render() {
    if (this.state.showTotpSetup) {
      return (<TotpSetup onValidToken={this.resetState} />);
    }
    if (this.state.showRemoveTotp) {
      return (<TotpRemove onRemove={this.resetState} />);
    }
    return this.renderPrefs();
  }

  private renderPrefs() {
    return (
      <div style={{padding: "30px"}}>
        <div className="form-group">
          <label>Two-Factor Authentication:</label>
          <input className="btn btn-default" type="button" value={totpValidator.enabled ? "Disable" : "Enable"} onClick={this.handle2FA} />
        </div>
        <hr/>
      </div>
    );
  }

  private handle2FA() {
    if (totpValidator.enabled) {
      this.setState({showRemoveTotp: true});
    } else {
      this.setState({showTotpSetup: true});
    }
  }

  private resetState() {
    this.setState({showTotpSetup: false, showRemoveTotp: false});
  }
}
