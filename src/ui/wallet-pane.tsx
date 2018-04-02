import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import {clipboard} from "electron";
import * as React from "react";
import * as Modal from "react-modal";
import { toast } from "react-toastify";
import {Wallet} from "../core/wallet";
import {WalletAccount} from "./wallet-store";
import {TransferPane} from "./transfer-pane";


interface WalletPaneProps {
    readonly account: WalletAccount;
}

@observer
export class WalletPane extends React.Component<WalletPaneProps, any> {
    @observable
    private showTransferPane: boolean = false;

    constructor(props: WalletPaneProps) {
        super(props);
        this.addNewAddress = this.addNewAddress.bind(this);
        this.copyAddress = this.copyAddress.bind(this);
    }

    public render() {
        const account = this.props.account;
        const wallet = account.wallet;
        return (
            <div style={{padding: "20px"}}>
                <h1>
                    <i className={"icon cc " + wallet.code} title={wallet.code}/>&nbsp;{wallet.name}
                </h1>
                <span className="coin_header">Total Balance: {account.totalBalance} {wallet.code}</span>
                <hr/>
                <input className="btn btn-default" type="button" value="Add New Address" onClick={this.addNewAddress}/>
                <input className="btn btn-default" type="button" value="Send Coin" onClick={() => this.showTransferPane = true}/>
                <hr/>

                {this.renderWalletBalances(account, wallet.code)}

                <Modal isOpen={this.showTransferPane}
                    onRequestClose={() => this.showTransferPane = false} contentLabel="Transfer"
                    shouldCloseOnOverlayClick={false} shouldCloseOnEsc={false} ariaHideApp={false}>
                    <TransferPane account={account} onComplete={() => this.showTransferPane = false} />
                </Modal>

            </div>
        );
    }

    private renderWalletBalances(account: WalletAccount, walletCode: string) {
        const rows = account.detailedBalances.map((balance, index) => {
            return (
                <tr key={index}>
                    <td>{index}&nbsp;
                        <input className="btn" type="button" value="Copy" onClick={() => this.copyAddress(balance.address)}/>
                    </td>
                    <td>{balance.address}</td>
                    <td>{balance.amount}&nbsp;{walletCode}</td>
                </tr>
            );
        });
        return (
            <table className="form-group">
                <thead>
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
        const account = this.props.account;
        const wallet = account.wallet;
        const newAddress = await wallet.addNewAddress();
        await account.update();
        toast.info(`Added new address ${newAddress}.`, {autoClose: 3000});
    }

    private copyAddress(address: string) {
        clipboard.writeText(address);
        toast.info(`Copied ${address} to clipboard.`, {autoClose: 1000});
    }
}
