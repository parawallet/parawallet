import * as React from "react";
import { IWallet } from "../core/wallet";
import { Preferences, PreferencesMenu } from "./preferences";
import { ToolsMenu } from "./tools-menu";
import { WalletMenu } from "./wallet-menu";
import { WalletPane } from "./wallet-pane";

interface IPageProps {
  readonly defaultWalletCode: string;
  readonly wallets: IWallet[];
}

const NA_ADDRESS = "Loading...";

class PageState {
  public readonly walletCode: string;
  public readonly showPrefs: boolean;

  constructor(walletCode: string, showPrefs: boolean) {
    this.walletCode = walletCode;
    this.showPrefs = showPrefs;
  }
}

class WalletState {
  public readonly wallet: IWallet;
  public readonly address: string;
  public readonly balance: number;

  constructor(wallet: IWallet, address?: string, balance?: number) {
    this.wallet = wallet;
    this.address = address || NA_ADDRESS;
    this.balance = balance || 0;
  }
}

class WalletsContext {
  private readonly walletStates = new Map<string, WalletState>();

  constructor(wallets: IWallet[]) {
    for (const w of wallets) {
      this.walletStates.set(w.code, new WalletState(w));
    }
  }

  public getState(walletCode: string): WalletState | undefined {
    return this.walletStates.get(walletCode);
  }

  public setState(walletCode: string, walletState: WalletState) {
    if (!this.walletStates.has(walletCode)) {
      throw new Error("Invalid wallet code: " + walletCode);
    }
    this.walletStates.set(walletCode, walletState);
  }
}

export class Page extends React.Component<IPageProps, PageState> {
  private walletsContext: WalletsContext;
  private timerID: NodeJS.Timer;

  constructor(props: IPageProps) {
    super(props);
    this.walletsContext = new WalletsContext(props.wallets);
    this.state = new PageState(props.defaultWalletCode, false);
    this.showPreferences = this.showPreferences.bind(this);
  }

  public componentDidMount() {
    this.updateActiveBalance();
    this.timerID = setInterval(() => this.updateActiveBalance(), 10000);
  }

  public componentWillUnmount() {
    clearInterval(this.timerID);
  }

  // If you don’t use something in render(), it shouldn’t be in the state.
  public render() {
    const ws = this.getWalletState(this.state.walletCode);
    return (
      <div className="pane-group">
        <div className="pane-sm sidebar">
          <WalletMenu wallets={this.props.wallets} onClick={(wlt) => this.switchWallet(wlt)} />
          <ToolsMenu />
          <PreferencesMenu onClick={this.showPreferences} />
        </div>
        <div className="pane">
          {this.state.showPrefs ? (
            <Preferences />
          ) : (
            <WalletPane wallet={ws.wallet} address={ws.address} balance={ws.balance} />
          )}
        </div>
      </div>
    );
  }

  private getWalletState(walletCode: string): WalletState {
    const ws = this.walletsContext.getState(walletCode);
    if (!ws) {
      throw new Error("Invalid wallet code: " + walletCode);
    }
    return ws;
  }

  // Do Not Modify State Directly. Instead, use setState().
  private switchWallet(wallet: IWallet) {
    const ws = this.getWalletState(wallet.code);
    this.setState(new PageState(wallet.code, false));
    if (ws.address === NA_ADDRESS) {
      this.updateBalance(wallet);
    }
  }

  private updateActiveBalance() {
    if (!this.state.showPrefs) {
      const ws = this.getWalletState(this.state.walletCode);
      this.updateBalance(ws.wallet);
    }
  }

  private updateBalance(wallet: IWallet) {
    wallet.update((address, balance) => {
      const ws = new WalletState(wallet, address, balance);
      this.walletsContext.setState(wallet.code, ws);
      this.setState((prevState, props) => new PageState(wallet.code, prevState.showPrefs));
    });
  }

  private showPreferences() {
    this.setState((prevState, props) => new PageState(prevState.walletCode, true));
  }
}
