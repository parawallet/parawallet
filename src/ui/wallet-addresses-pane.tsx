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
import {WalletPaneProps} from "./wallet-pane";


@observer
export class WalletAddressesPane extends React.Component<WalletPaneProps, any> {
    @observable
    private showEmptyAccounts: boolean = false;

    constructor(props: WalletPaneProps) {
        super(props);
        this.addNewAddress = this.addNewAddress.bind(this);
        this.copyAddress = this.copyAddress.bind(this);
    }

    public render() {
        const wallet = this.props.wallet;
        const rows = wallet.currentBalances.map((balance, index) => {
            const isPublicAddress = wallet.isPublicAddress(balance.address);
            if (balance.amount === 0 && !isPublicAddress && !this.showEmptyAccounts) {
                return null;
            }
            let copyBtn = null;
            if (isPublicAddress) {
                copyBtn = (
                    <button type="button" className="btn btn-outline-secondary btn-sm"
                            data-tip="Copy address to clipboard"
                            onClick={() => this.copyAddress(balance.address)}>Copy</button>
                );
            } else {
                copyBtn = (
                    <span data-tip="Do not share internal addresses for your own privacy.">
                        <em>internal</em>
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

        const emptyAccountsBtn = wallet.supportsMultiAddressTransactions() ? (
            <button type="button" className="btn btn-outline-primary btn-sm"
                    data-tip="Show/hide addresses with zero balances"
                    onClick={() => this.showEmptyAccounts = !this.showEmptyAccounts}>
                {this.showEmptyAccounts ? "Hide Empty" : "Show Empty"}
            </button>
        ) : null;

        return (
            <div>
                <div className="btn-group float-right" role="group" aria-label="Basic example">
                    {emptyAccountsBtn}
                    <button type="button" className="btn btn-outline-primary btn-sm"
                            data-tip="Refresh account balances"
                            onClick={() => wallet.updateBalances()}>
                        <i className="fas fa-sync" /> Refresh
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm"
                            data-tip="Add a new public address" onClick={this.addNewAddress}>
                        New Address
                    </button>
                </div>
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
