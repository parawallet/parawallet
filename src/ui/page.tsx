import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { IWallet, IWalletType } from "../core/wallet";
import { Preferences, PreferencesMenu } from "./preferences";
import { ToolsMenu } from "./tools-menu";
import { WalletMenu } from "./wallet-menu";
import { WalletPane } from "./wallet-pane";
import { WalletAccount, WalletStore } from "./wallet-store";

interface IPageProps {
  readonly defaultWalletCode: string;
  readonly wallets: IWallet[];
}

@observer
export class Page extends React.Component<IPageProps, any> {
  private walletsStore: WalletStore;
  private timerID: NodeJS.Timer;
  @observable
  private showPreferences: boolean = false;

  constructor(props: IPageProps) {
    super(props);
    this.walletsStore = new WalletStore(props.wallets, props.defaultWalletCode);
  }

  public componentDidMount() {
    this.updateActiveBalance();
    this.timerID = setInterval(() => this.updateActiveBalance(), 30000);
  }

  public componentWillUnmount() {
    clearInterval(this.timerID);
  }

  public render() {
    const account = this.walletsStore.activeAccount;
    return (
      <div className="pane-group">
        <div className="pane-sm sidebar">
          <WalletMenu wallets={this.props.wallets} onClick={(wlt) => this.switchWallet(wlt)} />
          <ToolsMenu />
          <PreferencesMenu onClick={() => this.showPreferences = true} />
        </div>
        <div className="pane">
          {this.showPreferences ? (
            <Preferences />
          ) : (
            <WalletPane wallet={account.wallet} address={account.address} balance={account.balance} />
          )}
        </div>
      </div>
    );
  }

  private switchWallet(wallet: IWalletType) {
    console.log(`Switching wallet: ${wallet.code}`);
    this.showPreferences = false;
    const account = this.walletsStore.switchWallet(wallet.code);
    if (account.address === WalletAccount.NA_ADDRESS) {
      this.updateBalance(account.wallet);
    }
  }

  private updateActiveBalance() {
    if (!this.showPreferences) {
      this.updateBalance(this.walletsStore.activeWallet);
    }
  }

  private updateBalance(wallet: IWallet) {
    wallet.update((address, balance) => {
      const walletAccount = this.walletsStore.getWalletAccount(wallet.code);
      walletAccount.update(address, balance);
    });
  }
}
