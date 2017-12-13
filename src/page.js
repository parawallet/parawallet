import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import * as BtcWallet from 'btc-wallet';
import * as BccWallet from 'bcc-wallet';
import * as LtcWallet from 'ltc-wallet';
import * as EthWallet from 'eth-wallet';
import * as XmrWallet from 'xmr-wallet';
import * as XrpWallet from 'xrp-wallet';


class Wallet {
    constructor(code, name, wallet) {
        this.code = code
        this.name = name
        this.impl = wallet
    }
}

var BTC = new Wallet("BTC", "Bitcoin", BtcWallet)
var ETH = new Wallet("ETH", "Ethereum", EthWallet)
var BCC = new Wallet("BCC", "Bitcoin Cash", BccWallet)
var LTC = new Wallet("LTC", "LiteCoin", LtcWallet)
var XRP = new Wallet("XRP", "Ripple", XrpWallet)
var XMR = new Wallet("XMR", "Monero", XmrWallet)

var wallets = [BTC, ETH, BCC, LTC, XRP, XMR]


class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            wallet: BTC
        };
        this.state.wallet.impl.updateTotalBalance();
    }

    componentDidUpdate() {
        this.state.wallet.impl.updateTotalBalance();
    }

    handleClick(wallet) {
        this.setState({
            wallet: wallet
        })
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
                <a className="nav-group-item">
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
        this.props.wallet.impl.send(this.state.address, Number(this.state.amount))
        event.preventDefault();
    }

    render() {
        return (
            <div style={{padding: '30px'}}>
                <h1>
                    <i className={'icon cc ' + this.props.wallet.code} title={this.props.wallet.code}></i>
                    &nbsp; {this.props.wallet.name} </h1>
                <span className="coin_header">Balance: <span
                    id={this.props.wallet.code + "-balance"}></span> {this.props.wallet.code}</span>

                <hr/>
                <h5>Receive {this.props.wallet.name}:</h5>
                Your Address: <span
                    id={this.props.wallet.code + "-address"}></span>


                <hr/>
                <h5>Send {this.props.wallet.name}:</h5>

                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>To Address:</label>
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
