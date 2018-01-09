import * as React from "react";
import { IWallet } from "../core/wallet";
import { ContentPane } from "./content-pane";
import { ToolsMenu } from "./tools-menu";
import { WalletMenu } from "./wallet-menu";

interface IPageProps {
  readonly defaultWalletCode: string;
  readonly wallets: IWallet[];
}

const NA_ADDRESS = "Loading...";

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

export class Page extends React.Component<IPageProps, WalletState> {
  private walletsContext: WalletsContext;
  private timerID: NodeJS.Timer;

  constructor(props: IPageProps) {
    super(props);
    this.walletsContext = new WalletsContext(props.wallets);
    this.state = this.getWalletState(props.defaultWalletCode);
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
    return (
      <div className="pane-group">
        <div className="pane-sm sidebar">
          <WalletMenu wallets={this.props.wallets} onClick={(wlt) => this.switchWallet(wlt)} />
          <ToolsMenu />
        </div>
        <div className="pane">
          <ContentPane wallet={this.state.wallet} address={this.state.address} balance={this.state.balance} />
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

  private getActiveWallet(): IWallet {
    return this.state.wallet;
  }

  // Do Not Modify State Directly. Instead, use setState().
  private switchWallet(wallet: IWallet) {
    const ws = this.getWalletState(wallet.code);
    this.setState(ws);
    if (ws.address === NA_ADDRESS) {
      this.updateBalance(wallet);
    }
  }

  private updateActiveBalance() {
    this.updateBalance(this.getActiveWallet());
  }

  private updateBalance(wallet: IWallet) {
    wallet.update((address, balance) => {
      const ws = new WalletState(wallet, address, balance);
      this.walletsContext.setState(wallet.code, ws);
      this.setState(ws);
    });
  }
}
