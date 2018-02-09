import * as bip39 from "bip39";
import * as React from "react";
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

class LoginPageState {
  public readonly showCreateNewDialog: boolean = false;
  public readonly showImportDialog: boolean = false;
}

export class Login extends React.Component<any, LoginPageState> {
  constructor(props: any) {
    super(props);
    this.state = new LoginPageState();
    this.handleLogin = this.handleLogin.bind(this);
    this.showCreateNew = this.showCreateNew.bind(this);
    this.handleCreateNew = this.handleCreateNew.bind(this);
    this.showImport = this.showImport.bind(this);
    this.handleImport = this.handleImport.bind(this);
    this.resetPage = this.resetPage.bind(this);
  }

  public render() {
    if (DB.exists(C.WALLET_DB)) {
      return (
        <LoginApp handle={this.handleLogin} />
      );
    } else if (this.state.showCreateNewDialog) {
      return (
        <CreateNewWallet handle={this.handleCreateNew} reset={this.resetPage} />
      );
    } else if (this.state.showImportDialog) {
      return (
        <ImportWallet handle={this.handleImport} reset={this.resetPage} />
      );
    } else {
      return this.renderInit();
    }
  }

  private renderInit() {
    return (
      <div style={{padding: "30px"}}>
        <div className="form-actions">
          <input className="btn btn-large" type="button" value="Create New Wallet" onClick={this.showCreateNew} />
          <input className="btn btn-large btn-default" type="button" value="Import Wallet" onClick={this.showImport} />
        </div>
      </div>
    );
  }

  private resetPage() {
    this.setState({showCreateNewDialog: false, showImportDialog: false});
  }

  private showCreateNew() {
    this.setState({showCreateNewDialog: true, showImportDialog: false});
  }

  private showImport() {
    this.setState({showCreateNewDialog: false, showImportDialog: true});
  }

  private handleCreateNew(credentials: LoginCredentials) {
    DB.open(C.WALLET_DB, credentials.appPass).then(() => {
      this.resetPage();
      this.props.onClick(credentials, LoginType.NEW);
    });
  }

  private handleImport(credentials: LoginCredentials, mnemonic: string) {
    DB.open(C.WALLET_DB, credentials.appPass).then(() => {
      restoreMnemonic(mnemonic, DB.get(C.WALLET_DB)!).then(() => {
          this.resetPage();
          this.props.onClick(credentials, LoginType.IMPORT);
        });
    });
  }

  private handleLogin(credentials: LoginCredentials) {
    this.props.onClick(credentials, LoginType.EXISTING);
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
      alert("Application passwords do not match!");
      return;
    }
    if (mnemonicPass !== confirmMnemonicPass) {
      alert("Mnemonic passwords do not match!");
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
      alert("Application passwords do not match!");
      return;
    }
    if (!bip39.validateMnemonic(mnemonic)) {
      // TODO: we can allow invalid mnemonics
      alert("Invalid mnemonic!");
      return;
    }

    const creds = new LoginCredentials(appPass, mnemonicPass);
    this.props.handle(creds, mnemonic);
  }
}
