import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import {clipboard, shell} from "electron";
import * as React from "react";
import { toast } from "react-toastify";
import {totpValidator, TotpVerifyDialog} from "./totp";
import {Wallet} from "./wallets";

interface TransferPaneProps {
    readonly wallet: Wallet;
    onComplete(): void;
}

@observer
export class TransferPane extends React.Component<TransferPaneProps, any> {
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
        this.changeFrom = this.changeFrom.bind(this);
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
                    {this.renderAddresses(wallet)}

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
                        <input className="btn btn-large btn-default" type="button" value="Close" onClick={this.props.onComplete} />
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

    private renderAddresses(wallet: Wallet) {
        if (wallet.supportsMultiAddress()) {
            return null;
        }
        this.from = wallet.currentBalances[0].address;
        const addresses = wallet.currentBalances.map((balance) =>
            (
            <option value={balance.address} key={balance.address}>
                {balance.address}&nbsp;&nbsp;===&nbsp;&nbsp;{balance.amount}&nbsp;{wallet.code}
            </option>
            ));
        return (
            <div className="form-group">
                <label>From Address:</label>
                <select className="form-control" onChange={this.changeFrom}>
                    {addresses}
                </select>
            </div>
        );
    }

    private changeFrom(event: any) {
        event.preventDefault();
        const address = event.target.value;
        console.log(`From changed to: ${address}`);
        this.from = address;
    }

    private handleTxnResult(event: any, txnResult: string) {
        event.preventDefault();
        const url = this.props.wallet.getExporerURL() + txnResult;
        console.log(`Opening ${url}`);
        shell.openExternal(url);
    }

    private handleSubmit(event: React.FormEvent<any>) {
        event.preventDefault();
        console.log(`Transfering ${this.amount} ${this.props.wallet.code} to ${this.address} from ${this.from}`);
        if (totpValidator.enabled) {
            this.verifyToken = true;
        } else {
            this.transfer();
        }
    }

    // TODO: update balance in main UI
    private async transfer() {
        const wallet = this.props.wallet;
        try {
            if (wallet.supportsMultiAddress()) {
                this.txnId = await wallet.send(this.address, Number(this.amount));
            } else {
                this.txnId = await wallet.sendFrom(this.from, this.address, Number(this.amount));
            }
            wallet.updateBalances();
        } catch (error) {
            toast.error(JSON.stringify(error));
        }
    }

    private onVerifyToken(valid: boolean) {
        this.verifyToken = false;
        if (!valid) {
            return;
        }
        this.transfer();
    }
}
