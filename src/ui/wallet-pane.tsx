import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import {clipboard} from "electron";
import * as React from "react";
import * as Modal from "react-modal";
import { toast } from "react-toastify";
import {Wallet} from "../core/wallet";
import {TransferPane} from "./transfer-pane";


interface WalletPaneProps {
    readonly wallet: Wallet;
}

@observer
export class WalletPane extends React.Component<WalletPaneProps, any> {
    @observable
    private showTransferPane: boolean = false;

    @observable
    private showEmptyAccounts: boolean = false;

    constructor(props: WalletPaneProps) {
        super(props);
        this.addNewAddress = this.addNewAddress.bind(this);
        this.copyAddress = this.copyAddress.bind(this);
    }

    public render() {
        const wallet = this.props.wallet;
        return (
            <div style={{padding: "20px"}}>
                <h1>
                    <i className={"icon cc " + wallet.code} title={wallet.code}/>&nbsp;{wallet.name}
                </h1>
                <span className="coin_header">Total Balance: {wallet.totalBalanceAmount} {wallet.code}</span>
                <hr/>
                <input className="btn btn-default" type="button" value="Add New Address" onClick={this.addNewAddress}/>
                <input className="btn btn-default" type="button" value="Refresh Balance" onClick={() => wallet.updateBalances()}/>
                <input className="btn btn-default" type="button" value="Send Coin" onClick={() => this.showTransferPane = true}/>
                <hr/>

                {this.renderWalletBalances(wallet)}

                <Modal isOpen={this.showTransferPane}
                    onRequestClose={() => this.showTransferPane = false} contentLabel="Transfer"
                    shouldCloseOnOverlayClick={false} shouldCloseOnEsc={false} ariaHideApp={false}>
                    <TransferPane wallet={wallet} onComplete={() => this.showTransferPane = false} />
                </Modal>

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
                copyBtn = (<input className="btn" type="button" value="Copy" onClick={() => this.copyAddress(balance.address)}/>);
            }
            return (
                <tr key={index}>
                    <td>{copyBtn}</td>
                    <td>{balance.address}</td>
                    <td>{balance.amount}&nbsp;{wallet.code}</td>
                </tr>
            );
        });

        const checkBoxRow = wallet.supportsMultiAddress() ? (
            <tr>
                <th colSpan={3}>
                <input type="checkbox" checked={this.showEmptyAccounts} onClick={() => this.showEmptyAccounts = !this.showEmptyAccounts}/>
                <label>Show addresses with zero balance</label>
                </th>
            </tr>
            ) : null;

        return (
            <table className="form-group">
                <thead>
                    {checkBoxRow}
                    <tr>
                        <th>#</th>
                        <th>Address</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
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
