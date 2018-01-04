import * as React from "react";
import * as ReactDOM from "react-dom";
import * as $ from "jquery";
import { BtcWallet } from "../core/btc-wallet";
import { EthWallet } from "../core/eth-wallet";
import * as db from "./secure-db";

const BTC = new BtcWallet(db.get());
const ETH = new EthWallet(db.get());

const wallets = [BTC, ETH];

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wallet: BTC,
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
          <WalletMenu onClick={(wlt) => this.handleClick(wlt)} />
          <ToolsMenu />
        </div>
        <div className="pane">
          <ContentPane wallet={this.state.wallet} />
        </div>
      </div>
    );
  }
}

class WalletMenu extends React.Component {
  render() {
    return (
      <nav className="nav-group">
        <h5 className="nav-group-title">Funds</h5>
        {wallets.map((it) =>
          <WalletMenuItem wallet={it} onClick={() => this.props.onClick(it)} key={it.code} />,
        )}
      </nav>
    );
  }
}

class WalletMenuItem extends React.Component {
  render() {
    return (
      <a className="nav-group-item" onClick={() => this.props.onClick()}>
        <i className={"icon cc " + this.props.wallet.code} title={this.props.wallet.code} />
        {this.props.wallet.name}
      </a>
    );
  }
}

class ToolsMenu extends React.Component {
  render() {
    return (
      <nav className="nav-group">
        <h5 className="nav-group-title">Tools Menu</h5>
        <a className="nav-group-item">
          <span className="icon icon-home" />
                    Exchange
        </a>
        <span className="nav-group-item">
          <span className="icon icon-download" />
    Coinbase
        </span>
        <span className="nav-group-item">
          <span className="icon icon-print" />
    Bittrex
        </span>
        <span className="nav-group-item">
          <span className="icon icon-cloud" />
    Gemini
        </span>
      </nav>
    );
  }
}

class ContentPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {address: "mq3ce8CE4jmyg5a8Y4HqcPtnLRGJu9qhHf", amount: "1000000"};

    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleAmountChange(event) {
    this.setState({amount: event.target.value});
  }

  handleAddressChange(event) {
    this.setState({address: event.target.value});
  }

  handleSubmit(event) {
    this.props.wallet.send(this.state.address, Number(this.state.amount), (address, balance) => {
      this.setBalance(address, balance);
    });
    event.preventDefault();
  }

  render() {
    return (
      <div style={{padding: "30px"}}>
        <h1>
          <i className={"icon cc " + this.props.wallet.code} title={this.props.wallet.code} />
          {this.props.wallet.name} </h1>
        <span className="coin_header">Balance: <span
          id={this.props.wallet.code + "-balance"} /> {this.props.wallet.code}</span>

        <hr />
        <h5>Receive {this.props.wallet.name}:</h5>
                Your Address: <span
          id={this.props.wallet.code + "-address"} />

        <hr />
        <h5>Send {this.props.wallet.name}:</h5>

        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label>To Address:</label>
            <input type="text" className="form-control" name="address"
              value={this.state.address} onChange={this.handleAddressChange} />
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input type="text" className="form-control" name="amount"
              value={this.state.amount} onChange={this.handleAmountChange} />
          </div>
          <div className="form-actions">
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
          </div>
        </form>

      </div>
    );
  }
}

ReactDOM.render(
  <Page />,
  document.getElementById("root"),
);
