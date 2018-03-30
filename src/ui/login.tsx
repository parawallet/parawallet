import * as bip39 from "bip39";
import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { toast } from "react-toastify";
import * as C from "../constants";
import { restoreMnemonic } from "../core/mnemonic";
import * as DB from "../db/secure-db";

const defaultPassword = "the-wallet-secure-password";

export class LoginCredentials {
  public readonly appPass: string;
  public readonly mnemonicPass: string;

  constructor(appPass: string, mnemonicPass: string) {
    this.appPass = appPass;
    this.mnemonicPass = mnemonicPass;
  }
}

export enum LoginType {
  NEW,
  IMPORT,
  EXISTING,
}

@observer
export class Login extends React.Component<any, any> {
  @observable
  private shouldShowCreateNewDialog: boolean = false;
  @observable
  private shouldShowImportDialog: boolean = false;

  constructor(props: any) {
    super(props);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleCreateNew = this.handleCreateNew.bind(this);
    this.handleImport = this.handleImport.bind(this);
  }

  public render() {
    if (DB.exists(C.WALLET_DB)) {
      return (
        <LoginApp handle={this.handleLogin} />
      );
    } else if (this.shouldShowCreateNewDialog) {
      return (
        <CreateNewWallet handle={this.handleCreateNew} reset={this.reset} />
      );
    } else if (this.shouldShowImportDialog) {
      return (
        <ImportWallet handle={this.handleImport} reset={this.reset} />
      );
    } else {
      return this.renderInit();
    }
  }

  private renderInit() {
    return (
      <div style={{padding: "30px"}}>
        <div className="form-actions">
          <input className="btn btn-large" type="button" value="Create New Wallet" onClick={this.showCreateNewDialog} />
          <input className="btn btn-large btn-default" type="button" value="Import Wallet" onClick={this.showImportDialog} />
        </div>
      </div>
    );
  }

  @action.bound
  private showCreateNewDialog() {
    this.shouldShowCreateNewDialog = true;
    this.shouldShowImportDialog = false;
  }

  @action.bound
  private showImportDialog() {
    this.shouldShowCreateNewDialog = false;
    this.shouldShowImportDialog = true;
  }

  @action.bound
  private reset() {
    this.shouldShowCreateNewDialog = false;
    this.shouldShowImportDialog = false;
  }

  private async handleCreateNew(credentials: LoginCredentials) {
    try {
      await DB.open(C.WALLET_DB, credentials.appPass);
      this.reset();
      this.props.onLogin(credentials, LoginType.NEW);
    } catch (error) {
      toast.error(JSON.stringify(error));
    }
  }

  private async handleImport(credentials: LoginCredentials, mnemonic: string) {
    try {
      const walletKv = await DB.open(C.WALLET_DB, credentials.appPass);
      restoreMnemonic(mnemonic, walletKv!);
      this.reset();
      this.props.onLogin(credentials, LoginType.IMPORT);
    } catch (error) {
      toast.error(JSON.stringify(error));
    }
  }

  private handleLogin(credentials: LoginCredentials) {
    this.props.onLogin(credentials, LoginType.EXISTING);
  }
}

class LoginApp extends React.Component<any, any> {
  private appPassInput: HTMLInputElement | null = null;
  private mnemonicPassInput: HTMLInputElement | null = null;

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
            <input type="text" className="form-control" defaultValue={defaultPassword} ref={(input) => this.appPassInput = input} />
          </div>
          <div className="form-group">
            <label>Mnemonic Password:</label>
            <input type="text" className="form-control" ref={(input) => this.mnemonicPassInput = input}  />
          </div>
          <div className="form-actions">
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
          </div>
        </form>
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

class CreateNewWallet extends React.Component<any, any> {
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
            <input type="text" className="form-control" defaultValue={defaultPassword} ref={(input) => this.appPassInput = input} />
          </div>
          <div className="form-group">
            <label>Confirm Application Password:</label>
            <input type="text" className="form-control" ref={(input) => this.confirmAppPassInput = input} />
          </div>
          <div className="form-group">
            <label>Mnemonic Password:</label>
            <input type="text" className="form-control" ref={(input) => this.mnemonicPassInput = input}  />
          </div>
          <div className="form-group">
            <label>Confirm Mnemonic Password:</label>
            <input type="text" className="form-control" ref={(input) => this.confirmMnemonicPassInput = input}  />
          </div>
          <div className="form-actions">
            <input className="btn btn-large" type="submit" value="Back" onClick={this.props.reset} />
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
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

class ImportWallet extends React.Component<any, any> {
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
      <div style={{padding: "30px"}}>
        <form onSubmit={this.handle}>
          <div className="form-group">
            <label>Application Password:</label>
            <input type="text" className="form-control" defaultValue={defaultPassword} ref={(input) => this.appPassInput = input} />
          </div>
          <div className="form-group">
            <label>Confirm Application Password:</label>
            <input type="text" className="form-control" ref={(input) => this.confirmAppPassInput = input} />
          </div>
          <div className="form-group">
            <label>Mnemonic:</label>
            <input type="text" className="form-control" ref={(input) => this.mnemonicInput = input}  />
          </div>
          <div className="form-group">
            <label>Mnemonic Password:</label>
            <input type="text" className="form-control" ref={(input) => this.mnemonicPassInput = input}  />
          </div>
          <div className="form-actions">
            <input className="btn btn-large" type="submit" value="Back" onClick={this.props.reset} />
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
          </div>
        </form>
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
