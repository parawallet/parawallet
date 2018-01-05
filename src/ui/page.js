import * as React from "react";
import { WalletMenu } from "./wallet-menu";
import { ToolsMenu } from "./tools-menu";
import { ContentPane } from "./content-pane";

// TODO: keep all wallet states, just switch active wallet
class WalletState {
  constructor(wallet, address, balance) {
    this.wallet = wallet;
    this.address = address || "Loading...";
    this.balance = balance || "0";
  }
}

export class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = new WalletState(props.defaultWallet);
  }

  componentDidMount() {
    this.updateBalance(this.state.wallet);
    this.timerID = setInterval(() => this.updateBalance(this.state.wallet), 10000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  // Do Not Modify State Directly. Instead, use setState().
  switchWallet(wallet) {
    this.setState(new WalletState(wallet));
    this.updateBalance(wallet);
  }

  updateBalance(wallet) {
    wallet.updateTotalBalance((address, balance) => {
      this.setState(new WalletState(wallet, address, balance));
    });
  }

  // If you don’t use something in render(), it shouldn’t be in the state.
  render() {
    return (
      <div className="pane-group">
        <div className="pane-sm sidebar">
          <WalletMenu wallets={this.props.wallets} onClick={(wlt) => this.switchWallet(wlt)} />
          <ToolsMenu />
        </div>
        <div className="pane">
          <ContentPane data={this.state} />
        </div>
      </div>
    );
  }
}
