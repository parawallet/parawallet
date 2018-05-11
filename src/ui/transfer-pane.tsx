import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { toast } from "react-toastify";
import {totpValidator, TotpVerifyDialog} from "./totp";
import {Wallet} from "./wallets";
import { stringifyErrorReplacer, stringifyErrorMessageReplacer } from "../util/errors";

interface TransferPaneProps {
    readonly wallet: Wallet;
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
    private submitted: boolean = false;

    public constructor(props: TransferPaneProps) {
        super(props);
        this.changeFrom = this.changeFrom.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.onVerifyToken = this.onVerifyToken.bind(this);
        this.reset = this.reset.bind(this);
    }

    public render() {
        const wallet = this.props.wallet;

        if (this.verifyToken) {
            return <TotpVerifyDialog show={true} onVerify={this.onVerifyToken}/>;
        }
        return (
            <div>
                <div className="alert alert-primary" role="alert">
                    <i className="fas fa-info-circle" />
                    Ensure that the address is correct and valid {wallet.name} address. Otherwise, your fund can be lost.
                </div>
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
                    <div className="btn-group" role="group" aria-label="Basic example">
                        <input className="btn btn-outline-primary" type="submit" value="Send" disabled={this.submitted} />
                        <input className="btn btn-outline-secondary" type="button" value="Reset" onClick={this.reset} />
                    </div>
                </form>
            </div>
        );
    }

    private renderAddresses(wallet: Wallet) {
        if (wallet.supportsMultiAddressTransactions()) {
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

    private reset() {
        this.address = "";
        this.amount = 0;
        this.verifyToken = false;
        this.submitted = false;
    }

    private changeFrom(event: any) {
        event.preventDefault();
        const address = event.target.value;
        console.log(`From changed to: ${address}`);
        this.from = address;
    }

    private handleSubmit(event: React.FormEvent<any>) {
        event.preventDefault();
        if (this.submitted) {
            return;
        }

        if (!this.validateParams()) {
            return;
        }

        this.submitted = true;
        console.log(`Transfering ${this.amount} ${this.props.wallet.code} to ${this.address} from ${this.from}`);
        if (totpValidator.enabled) {
            this.verifyToken = true;
        } else {
            this.transfer();
        }
    }

    private validateParams(): boolean {
        const wallet = this.props.wallet;
        if (!wallet.supportsMultiAddressTransactions()) {
            if (!this.from || !this.from.trim().length) {
                toast.error("'From Address' is required!");
                return false;
            }
            try {
                wallet.validateAddress(this.from);
            } catch (error) {
                toast.error("Invalid 'From Address'");
                return false;
            }
        }

        if (!this.address || !this.address.trim().length) {
            toast.error("'To Address' is required!");
            return false;
        }
        try {
            wallet.validateAddress(this.address);
        } catch (error) {
            toast.error("Invalid 'To Address'");
            return false;
        }

        if (!isNumeric(this.amount) || Number(this.amount) <= 0) {
            toast.error("Invalid amount");
            return false;
        }

        return true;
    }

    private async transfer() {
        const wallet = this.props.wallet;
        let txnId: string;
        try {
            const callback = (txid: string, status: string) => {
                toast.warn(`${wallet.name} transaction [${txid}] is completed with ${status}.`);
            };
            if (wallet.supportsMultiAddressTransactions()) {
                txnId = await wallet.send(this.address, Number(this.amount), callback);
            } else {
                txnId = await wallet.send(this.address, Number(this.amount), callback, this.from);
            }
            this.reset();
        } catch (error) {
            console.log(JSON.stringify(error, stringifyErrorReplacer));
            toast.error(JSON.stringify(error, stringifyErrorMessageReplacer));
            this.submitted = false;
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

function isNumeric(n: any): boolean {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
