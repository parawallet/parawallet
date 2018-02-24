import { action, autorun, computed, observable } from "mobx";
import { observer } from "mobx-react";
import {clipboard, shell} from "electron";
import * as React from "react";
import {IWallet} from "../core/wallet";
import {totpValidator, TotpVerifyDialog} from "./totp";


interface IContentPaneProps {
    readonly wallet: IWallet;
    readonly address: string;
    readonly balance: number;
}

@observer
export class WalletPane extends React.Component<IContentPaneProps, any> {
    constructor(props: IContentPaneProps) {
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

interface ITransferPaneProps {
    readonly wallet: IWallet;
}

@observer
class TransferPane extends React.Component<ITransferPaneProps, any> {
    private readonly wallet: IWallet;

    @observable
    private address: string = "";
    @observable
    private amount: number | string = 0;
    @observable
    private verifyToken: boolean = false;
    @observable
    private explorerUrl: string;
    @observable
    private txnId: string;

    public constructor(props: ITransferPaneProps) {
        super(props);
        this.wallet = props.wallet;
        this.handleSubmit = this.handleSubmit.bind(this);
        this.onVerifyToken = this.onVerifyToken.bind(this);
    }

    public render() {
        if (this.verifyToken) {
            return <TotpVerifyDialog show={true} onVerify={this.onVerifyToken}/>;
        }
        return (
            <div>
                <h5>Send {this.props.wallet.name}:</h5>

                <form onSubmit={this.handleSubmit}>
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
                <a className="txn-result" href="#" onClick={(event) => this.handleTxnResult(event, this.explorerUrl, this.txnId )}>
                    {this.txnId ? "Transaction completed click for details." : ""}
                </a>
                <br/>
                {this.txnId ? "Transaction id: " + this.txnId : ""}

            </div>
        );
    }

    private handleTxnResult(event: any, explorerUrl: string, txnResult: string) {
        event.preventDefault();
        shell.openExternal(explorerUrl + txnResult);
    }

    private handleSubmit(event: React.FormEvent<any>) {
        event.preventDefault();
        console.log(`Transfering ${this.amount} ${this.wallet.code} to ${this.address}`);
        if (totpValidator.enabled) {
            this.verifyToken = true;
        } else {
            this.transfer();
        }
    }

    // TODO: update balance in main UI
    private transfer() {
        this.wallet.send(this.address, Number(this.amount), (explorerUrl: string, txnResult: string) => {
            this.explorerUrl = explorerUrl;
            this.txnId = txnResult;
        });
    }

    private onVerifyToken(valid: boolean) {
        this.verifyToken = false;
        if (!valid) {
            return;
        }
        this.transfer();
    }
}
