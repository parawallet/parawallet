import {observer} from "mobx-react";
import {clipboard, shell} from "electron";
import * as React from "react";
import {toast} from "react-toastify";
import {WalletTabPaneProps} from "../wallet-pane";


@observer
export class WalletAddressesPane extends React.Component<WalletTabPaneProps, any> {
    constructor(props: WalletTabPaneProps) {
        super(props);
    }

    public render() {
        const wallet = this.props.wallet;
        const rows = wallet.currentBalances.map((balance, index) => {
            const isPublicAddress = wallet.isPublicAddress(balance.address);
            // we do not show private accounts with zero balance
            if (balance.amount === 0 && !isPublicAddress) {
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
                    <td style={{width: "435px"}}>{balance.address}
                        {wallet.getExporerURL("address") ?
                            (<a href="#" onClick={() => this.openAddressOnExplorer(balance.address)}> <i
                                className="fas fa-search" data-tip="Search the address on blockchain."/> </a>)
                            : ""}
                    </td>
                    <td>{balance.amount}&nbsp;{wallet.code}</td>
                    <td>{wallet.isPublicAddress(balance.address) ? balance.address === wallet.defaultAddress ? <b>Default Address</b> :
                        <a data-tip="Set as wallet's default receive address"
                        className="link" href="#" onClick={() => this.setDefaultAddress(balance.address)}>Set As Default</a> : ""}</td>
                </tr>
            );
        });

        return (
            <div>
                <div className="btn-group float-right" role="group" aria-label="Basic example">
                    <button type="button" className="btn btn-outline-primary btn-sm"
                            data-tip="Refresh account balances"
                            onClick={() => wallet.updateBalances()}>
                        <i className="fas fa-sync" />
                        Refresh
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm"
                            data-tip="Add a new public address" onClick={() => this.addNewAddress()}>
                        <i className="fas fa-plus" />
                        New Address
                    </button>
                </div>
                <table className="table addressTable">
                    <thead className="thead">
                    <tr>
                        <th scope="col"/>
                        <th scope="col">Address</th>
                        <th scope="col">Amount</th>
                        <th scope="col"/>
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
    }

    private setDefaultAddress(address: string) {
        const wallet = this.props.wallet;
        wallet.setDefaultAddress(address);
        toast.info(`${address} is set as your default public address.`, {autoClose: 2000});
    }

    private openAddressOnExplorer(address: string) {
        const url = this.props.wallet.getExporerURL("address") + address;
        shell.openExternal(url);
    }
}
