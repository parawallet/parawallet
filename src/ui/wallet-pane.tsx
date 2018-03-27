import { action, autorun, computed, observable } from "mobx";
import { observer } from "mobx-react";
import {clipboard, shell} from "electron";
import * as React from "react";
import { toast } from "react-toastify";
import {Wallet} from "../core/wallet";
import {totpValidator, TotpVerifyDialog} from "./totp";


interface ContentPaneProps {
    readonly wallet: Wallet;
    readonly address: string;
    readonly balance: number;
}

@observer
export class WalletPane extends React.Component<ContentPaneProps, any> {
    constructor(props: ContentPaneProps) {
        super(props);
        this.copyAddress = this.copyAddress.bind(this);
    }

    public render() {
        const wallet = this.props.wallet;
        return (
            <div style={{padding: "20px"}}>
                <h1>
                    <i className={"icon cc " + wallet.code} title={wallet.code}/>&nbsp;{wallet.name}
                </h1>
                <span className="coin_header">Balance: {this.props.balance} {wallet.code}</span>
                <hr/>
                <h5>Receive {wallet.name}:</h5> Your Address:
                <input type="text" className="form-control" readOnly={true} value={this.props.address}/>
                <input className="btn btn-default" type="button" value="Copy Address" onClick={this.copyAddress}/>
                <hr/>
                <TransferPane wallet={wallet}/>
            </div>
        );
    }

    private copyAddress() {
        clipboard.writeText(this.props.address);
    }
}

interface TransferPaneProps {
    readonly wallet: Wallet;
}

@observer
class TransferPane extends React.Component<TransferPaneProps, any> {
    @observable
    private from: string = "";
    @observable
    private address: string = "";
    @observable
    private amount: number | string = 0;
    @observable
    private verifyToken: boolean = false;
    @observable
    private txnId: string;

    public constructor(props: TransferPaneProps) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.onVerifyToken = this.onVerifyToken.bind(this);
    }

    public render() {
        const wallet = this.props.wallet;

        if (this.verifyToken) {
            return <TotpVerifyDialog show={true} onVerify={this.onVerifyToken}/>;
        }
        return (
            <div>
                <h5>Send {wallet.name}:</h5>

                <form onSubmit={this.handleSubmit}>
                    {this.renderWalletAddresses(wallet)}

                    <div className="form-group">
                        <label>To Address:</label>
                        <input type="text" className="form-control" value={this.address} onChange={(event) => this.address = event.target.value}/>
                    </div>
                    <div className="form-group">
                        <label>Amount:</label>
                        <input type="text" className="form-control" value={this.amount} onChange={(event) => this.amount = event.target.value}/>
                    </div>
                    <div className="form-actions">
                        <input className="btn btn-large btn-default" type="submit" value="Submit"/>
                    </div>
                </form>
                <a className="txn-result" href="#" onClick={(event) => this.handleTxnResult(event, this.txnId)}>
                    {this.txnId ? "Transaction completed click for details." : ""}
                </a>
                <br/>
                {this.txnId ? "Transaction id: " + this.txnId : ""}

            </div>
        );
    }

    private renderWalletAddresses(wallet: Wallet) {
        if (wallet.supportsMultiAddress()) {
            return null;
        }
        const addresses = wallet.allAddresses().map((address) => (<option value={address} key={address}>{address}</option>));
        return (
            <div className="form-group">
                <label>From Address:</label>
                <select className="form-control" onChange={(event) => this.from = event.target.value}>
                    {addresses}
                </select>
            </div>
        );
    }

    private handleTxnResult(event: any, txnResult: string) {
        event.preventDefault();
        const url = this.props.wallet.getExporerURL() + txnResult;
        console.log(`Opening ${url}`);
        shell.openExternal(url);
    }

    private handleSubmit(event: React.FormEvent<any>) {
        event.preventDefault();
        console.log(`Transfering ${this.amount} ${this.props.wallet.code} to ${this.address}`);
        if (totpValidator.enabled) {
            this.verifyToken = true;
        } else {
            this.transfer();
        }
    }

    // TODO: update balance in main UI
    private transfer() {
        const wallet = this.props.wallet;
        let p: Promise<string>;
        if (wallet.supportsMultiAddress()) {
            p = wallet.send(this.address, Number(this.amount));
        } else {
            p = wallet.sendFrom(this.from, this.address, Number(this.amount));
        }

        p.then((txnResult) => this.txnId = txnResult)
            .catch((e) => toast.error(JSON.stringify(e)));
    }

    private onVerifyToken(valid: boolean) {
        this.verifyToken = false;
        if (!valid) {
            return;
        }
        this.transfer();
    }
}
