import {computed, observable, reaction, action} from "mobx";
import {observer} from "mobx-react";
import {clipboard, shell} from "electron";
import * as React from "react";
import * as Modal from "react-modal";
import {toast} from "react-toastify";
import {Wallet} from "../core/wallet";
import {TransferPane} from "./transfer-pane";
import {PaneHeader} from "./pane-header";
import * as ReactTooltip from "react-tooltip";



interface WalletPaneProps {
    readonly wallet: Wallet;
}

@observer
export class WalletPane extends React.Component<WalletPaneProps, any> {
    @observable
    private showTransferPane: boolean = false;

    @observable
    private showEmptyAccounts: boolean = false;

    @observable
    private showTransactions: boolean = false;

    constructor(props: WalletPaneProps) {
        super(props);
        this.addNewAddress = this.addNewAddress.bind(this);
        this.copyAddress = this.copyAddress.bind(this);
        this.onTransactionSubmit = this.onTransactionSubmit.bind(this);
    }

    public render() {
        const wallet = this.props.wallet;
        return (
            <div>
                <PaneHeader title={wallet.name} icon={"icon cc " + wallet.code}
                            subtitle={"Current Balance: " + wallet.totalBalanceAmount + wallet.code}/>

                <ul className="nav nav-tabs wallet-tabs" id="myTab" role="tablist">
                    <li className="nav-item">
                        <a className="nav-link active" id="addresses-tab" data-toggle="tab" href="#addresses" role="tab"
                           aria-controls="addresses" aria-selected="false">Addresses</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="send-tab" data-toggle="tab" href="#send" role="tab"
                           aria-controls="send" aria-selected="false">Send</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="transactions-tab" data-toggle="tab" href="#transactions" role="tab"
                           aria-controls="transactions" aria-selected="false">Transactions</a>
                    </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                    <div className="tab-pane fade show active" id="addresses" role="tabpanel"
                         aria-labelledby="addresses-tab">
                        {this.renderWalletBalances(wallet)}
                    </div>
                    <div className="tab-pane fade" id="send" role="tabpanel" aria-labelledby="send-tab">
                        <TransferPane wallet={wallet} onSubmit={this.onTransactionSubmit}
                                      onCancel={() => this.showTransferPane = false}/>
                    </div>
                    <div className="tab-pane fade" id="transactions" role="tabpanel" aria-labelledby="transactions-tab">
                        {this.renderTransactions(wallet)}
                    </div>
                </div>
            </div>
        );
    }

    private renderWalletBalances(wallet: Wallet) {
        const rows = wallet.currentBalances.map((balance, index) => {
            const isPublicAddress = wallet.isPublicAddress(balance.address);
            if (balance.amount === 0 && !isPublicAddress && !this.showEmptyAccounts) {
                return null;
            }
            let copyBtn = null;
            if (isPublicAddress) {
                copyBtn = (
                    <button type="button" className="btn btn-outline-secondary btn-sm"
                            onClick={() => this.copyAddress(balance.address)}>Copy</button>
                );
            } else {
                copyBtn = (
                    <span data-tip="Do not share internal addresses for your privacy.">
                        <em>internal</em>
                        <ReactTooltip />
                    </span>
                );
            }
            return (
                <tr key={index}>
                    <td style={{width: "90px"}}>{copyBtn}</td>
                    <td style={{width: "325px"}}>{balance.address}</td>
                    <td>{balance.amount}&nbsp;{wallet.code}</td>
                </tr>
            );
        });

        const checkBoxRow = wallet.supportsMultiAddress() ? (
            <div>
                <input type="checkbox" checked={this.showEmptyAccounts}
                       onClick={() => this.showEmptyAccounts = !this.showEmptyAccounts}/>
                <label>Show addresses with zero balance</label>
            </div>
        ) : null;

        return (
            <div>
                <div className="btn-group float-right" role="group" aria-label="Basic example">
                    <button type="button" className="btn btn-outline-primary btn-sm"
                            onClick={() => wallet.updateBalances()}>
                        <i className="fas fa-sync" /> Refresh
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={this.addNewAddress}>
                        New Address
                    </button>
                </div>
                {/*{wallet.supportsMultiAddress() ? (*/}
                {/*<div>*/}
                {/*<input type="checkbox" checked={this.showEmptyAccounts}*/}
                {/*onClick={() => this.showEmptyAccounts = !this.showEmptyAccounts}/>*/}
                {/*<label>Show addresses with zero balance</label>*/}
                {/*</div>*/}
                {/*) : null}*/}
                <table className="table addressTable">
                    <thead className="thead">
                    <tr>
                        <th scope="col"/>
                        <th scope="col">Address</th>
                        <th scope="col">Amount</th>
                    </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
        );
    }

    private renderTransactions(wallet: Wallet) {
        const rows = wallet.knownTransactions.map((tx, index) => {
            return (
                <tr key={index}>
                    <td>{tx.status}</td>
                    <td><a className="txn-result" href="#"
                           onClick={(event) => this.openTxnExplorer(event, tx.id)}>{tx.id}</a></td>
                    <td>{tx.amount}</td>
                    <td>{tx.destination}</td>
                </tr>
            );
        });
        return (
            <table className="table">
                <thead className="thead">
                <tr>
                    <th>Status</th>
                    <th>TxID</th>
                    <th>Amount</th>
                    <th>Destination</th>
                </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        );
    }

    @action
    private onTransactionSubmit() {
        this.showTransferPane = false;
        this.showTransactions = true;
    }

    private openTxnExplorer(event: any, txid: string) {
        event.preventDefault();
        const url = this.props.wallet.getExporerURL() + txid;
        console.log(`Opening ${url}`);
        shell.openExternal(url);
    }

    private async addNewAddress() {
        const wallet = this.props.wallet;
        const newAddress = await wallet.addNewAddress();
        toast.info(`Added new address ${newAddress}.`, {autoClose: 3000});
    }

    private copyAddress(address: string) {
        clipboard.writeText(address);
        toast.info(`Copied ${address} to clipboard.`, {autoClose: 1000});
    }
}
