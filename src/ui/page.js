import * as React from "react";
import * as $ from "jquery";

import { WalletMenu } from "./wallet-menu";
import { ToolsMenu } from "./tools-menu";
import { ContentPane } from "./content-pane";

export class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wallet: props.defaultWallet,
    };
  }

  componentDidMount() {
    this.updateBalance();
  }

  componentDidUpdate() {
    this.updateBalance();
  }

  updateBalance() {
    var code = this.state.wallet.code;
    $("#" + code + "-address").html("Fetching...");
    $("#" + code + "-balance").html("Fetching...");

    this.state.wallet.updateTotalBalance((address, balance) => {
      this.setBalance(address, balance);
    });
  }

  setBalance(address, balance) {
    var code = this.state.wallet.code;
    $("#" + code + "-address").html(address);
    $("#" + code + "-balance").html(balance);
  }

  handleClick(wallet) {
    this.setState({
      wallet: wallet,
    });
  }

  render() {
    return (
      <div className="pane-group">
        <div className="pane-sm sidebar">
          <WalletMenu wallets={this.props.wallets} onClick={(wlt) => this.handleClick(wlt)} />
          <ToolsMenu />
        </div>
        <div className="pane">
          <ContentPane wallet={this.state.wallet} />
        </div>
      </div>
    );
  }
}
