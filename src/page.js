import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import * as BtcWallet from 'btc-wallet';


class Wallet {
    constructor(code, name, wallet) {
        this.code = code
        this.name = name
        this.wallet = wallet
    }
}

var BTC = new Wallet("BTC", "Bitcoin", BtcWallet)
var ETH = new Wallet("ETH", "Ethereum", BtcWallet)
var BCC = new Wallet("BCC", "Bitcoin Cash", BtcWallet)
var LTC = new Wallet("LTC", "LiteCoin", BtcWallet)
var XRP = new Wallet("XRP", "Ripple", BtcWallet)
var XMR = new Wallet("XMR", "Monero", BtcWallet)

var wallets = [BTC, ETH, BCC, LTC, XRP, XMR]


class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            wallet: BTC
        };
    }

    handleClick(wallet) {
        this.setState({
            wallet: wallet
        })
        BtcWallet.updateTotalBalance();
    }

    render() {
        return (
            <div className="pane-group">
                <div className="pane-sm sidebar">
                    <WalletMenu onClick={(wlt) => this.handleClick(wlt)}/>
                    <ToolsMenu/>
                </div>
                <div className="pane">
                    <ContentPane wallet={this.state.wallet}/>
                </div>
            </div>
        )
    }
}


class WalletMenu extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <nav className="nav-group">
                <h5 className="nav-group-title">Funds</h5>
                {wallets.map((it) =>
                    <WalletMenuItem wallet={it} onClick={() => this.props.onClick(it)}/>
                )}
            </nav>
        )
    }
}

class WalletMenuItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <a className="nav-group-item" onClick={() => this.props.onClick()}>
                <i className={'icon cc ' + this.props.wallet.code} title={this.props.wallet.code}></i>
                {this.props.wallet.name}
            </a>
        )
    }
}


class ToolsMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <nav className="nav-group">
                <h5 className="nav-group-title">Tools Menu</h5>
                <a class="nav-group-item active">
                    <span className="icon icon-home"></span>
                    Exchange
                </a>
                <span className="nav-group-item">
    <span className="icon icon-download"></span>
    Coinbase
  </span>
                <span className="nav-group-item">
    <span className="icon icon-print"></span>
    Bittrex
  </span>
                <span className="nav-group-item">
    <span className="icon icon-cloud"></span>
    Gemini
  </span>
            </nav>
        )
    }
}


class ContentPane extends React.Component {
    constructor(props) {
        super(props);
        this.state = {address: 'mq3ce8CE4jmyg5a8Y4HqcPtnLRGJu9qhHf', amount: "1000000"};

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
        BtcWallet.send(this.state.address, Number(this.state.amount))
        event.preventDefault();
    }

    render() {
        return (
            <div style={{padding: '30px'}}>
                <h1>
                <i className={'icon cc ' + this.props.wallet.code} title={this.props.wallet.code}></i>
                    &nbsp; {this.props.wallet.name} </h1>
                <span className="coin_header">Balance: <span id="balance"></span> {this.props.wallet.code}</span>

                <h3>Send {this.props.wallet.name}:</h3>

                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Address:</label>
                        <input type="text" className="form-control" name="address"
                               value={this.state.address} onChange={this.handleAddressChange}/>
                    </div>
                    <div className="form-group">
                        <label>Amount:</label>
                        <input type="text" className="form-control" name="amount"
                               value={this.state.amount} onChange={this.handleAmountChange}/>
                    </div>
                    <div className="form-actions">
                        <input className="btn btn-large btn-default" type="submit" value="Submit"/>
                    </div>
                </form>

            </div>
        )
    }
}


ReactDOM.render(
    <Page/>,
    document.getElementById('root')
);

BtcWallet.updateTotalBalance();
