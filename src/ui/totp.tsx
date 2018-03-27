import * as qrcode from "qrcode";
import * as React from "react";
import * as Modal from "react-modal";
import SecoKeyval from "seco-keyval";
import * as auth from "speakeasy";
import * as C from "../constants";
import * as DB from "../db/secure-db";

// https://github.com/speakeasyjs/speakeasy
// https://github.com/soldair/node-qrcode#usage

class TotpParams {
  public readonly enabled: boolean;
  public readonly secret: auth.Key | undefined;

  constructor(enabled: boolean, secret?: auth.Key) {
    if (enabled) {
      if (!secret) {
        throw new Error("Secret is needed!");
      }
    }
    this.enabled = enabled;
    this.secret = secret;
  }
}

class TotpValidator {
  private params = new TotpParams(false);

  public restore(kv: SecoKeyval) {
    return kv.get(C.TOTP_PARAMS).then((params: TotpParams) => {
      this.params = params || new TotpParams(false);
      console.log("TOTP PARAMS: " + JSON.stringify(this.params));
    });
  }

  public initialize(secret: auth.Key, kv: SecoKeyval) {
    this.params = new TotpParams(true, secret);
    return kv.set(C.TOTP_PARAMS, this.params);
  }

  public remove(kv: SecoKeyval) {
    this.params = new TotpParams(false);
    return kv.set(C.TOTP_PARAMS, this.params);
  }

  public validate(token: string): boolean {
    if (this.enabled) {
      return verifyToken(this.secret, token);
    }
    return false;
  }

  public get enabled() {
    return this.params.enabled;
  }

  private get secret(): string {
    if (this.enabled) {
      return this.params.secret!.base32;
    }
    return "";
  }
}

export const totpValidator = new TotpValidator();

export class TotpSetup extends React.Component<any, any> {
  private readonly secret: auth.Key;
  private userToken: HTMLInputElement | null;

  constructor(props: any) {
    super(props);
    this.secret = auth.generateSecret({name: "thewallet"});
    this.enable2FA = this.enable2FA.bind(this);
    this.validate = this.validate.bind(this);
    this.state = {enable2FA: false, qrcodeUrl: ""};
  }

  public render() {
    if (this.state.enable2FA) {
      return (
        <div style={{padding: "30px"}}>
          <label>URL: {this.secret.otpauth_url}</label>
          <img src={this.state.qrcodeUrl} alt="Loading QRCode..." />
          <div className="form-group">
            <label>Please Enter Token:</label>
            <input type="text" className="form-control" ref={(input) => this.userToken = input} />
          </div>
          <div className="form-actions">
            <input className="btn btn-large btn-default" type="submit" value="Validate" onClick={this.validate} />
          </div>
        </div>
      );
    }

    return (
      <div style={{padding: "30px"}}>
        <div className="form-group">
          <label>Do you want to enable Two-Factor Authentication?</label>
        </div>
        <div className="form-actions">
          <input className="btn btn-large" type="submit" value="No" onClick={this.props.onValidToken} />
          <input className="btn btn-large btn-default" type="submit" value="Yes" onClick={this.enable2FA} />
        </div>
      </div>
    );
  }

  private enable2FA(event: any) {
    event.preventDefault();
    console.log(this.secret.otpauth_url);
    qrcode.toDataURL(this.secret.otpauth_url!, (err, url) => {
      this.setState({qrcodeUrl: url});
    });
    this.setState({enable2FA: true});
  }

  private validate(event: any) {
    event.preventDefault();
    const userToken = this.userToken ? this.userToken.value : null;
    if (!userToken) {
      alert("Please enter token!");
      return;
    }
    const valid = verifyToken(this.secret.base32, userToken);
    if (!valid) {
      alert("Invalid token!");
      return;
    }
    totpValidator.initialize(this.secret, DB.get(C.CONFIG_DB)!).then(() => {
      this.props.onValidToken();
    });
  }
}

export class TotpVerifyDialog extends React.Component<any, any> {
  private tokenInput: HTMLInputElement | null;

  constructor(props: any) {
    super(props);
    this.state = {show: props.show};

    this.closeDialog = this.closeDialog.bind(this);
    this.verifyToken = this.verifyToken.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  public render() {
    return (
        <Modal
          isOpen={this.state.show}
          onRequestClose={this.closeDialog}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={false}
          ariaHideApp={false}
          contentLabel="Validate TOTP"
        >
        <div style={{padding: "30px"}}>
          <div className="form-group">
            <label>Please Enter 2FA Token :</label>
            <input type="text" className="form-control" ref={(input) => this.tokenInput = input} />
          </div>
          <div className="form-actions">
            <input className="btn btn-large" type="submit" value="Cancel"  onClick={this.cancel}/>
            <input className="btn btn-large btn-default" type="submit" value="Verify"  onClick={this.verifyToken}/>
          </div>
        </div>
      </Modal>
    );
  }

  private closeDialog() {
    this.setState({show: false});
  }

  private verifyToken(event: any) {
    event.preventDefault();
    const userToken = this.tokenInput ? this.tokenInput.value : null;
    if (!userToken) {
      alert("Please enter token!");
      return;
    }
    const valid = totpValidator.validate(userToken);
    if (!valid) {
      alert("Invalid token!");
    }
    this.closeDialog();
    this.props.onVerify(valid);
  }

  private cancel(event: any) {
    event.preventDefault();
    this.closeDialog();
    this.props.onVerify(false);
  }
}

export class TotpRemove extends React.Component<any, any> {

  constructor(props: any) {
    super(props);
    this.remove2Fa = this.remove2Fa.bind(this);
    this.state = {enable2FA: false, qrcodeUrl: ""};
  }

  public render() {
      return (
          <TotpVerifyDialog show={true} onVerify={this.remove2Fa} />
      );
  }

  private remove2Fa(valid: boolean) {
    if (!valid) {
      this.props.onRemove();
      return;
    }

    totpValidator.remove(DB.get(C.CONFIG_DB)!).then(() => {
      this.props.onRemove();
    });
  }
}

function verifyToken(secretBase32: string, userToken: string): boolean {
  return auth.totp.verify({ secret: secretBase32, encoding: "base32", token: userToken });
}
