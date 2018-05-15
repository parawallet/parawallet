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
export class WalletTransactionsPane extends React.Component<WalletPaneProps, any> {

    constructor(props: WalletPaneProps) {
        super(props);
    }

    public render() {
        const wallet = this.props.wallet;
        const rows = wallet.knownTransactions.map((tx, index) => {
            return (
                <tr key={index}>
                    <td>{tx.status === "success" ? "☑️" :  (tx.status === "pending" ? "⏳" : "❌")}</td>
                    <td>{new Date(tx.timestamp).toDateString()}</td>
                    <td><a className="txn-result" href="#"
                           onClick={(event) => this.openTxnExplorer(event, tx.id)}>{tx.id.slice(0, 15) + "..."}</a></td>
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
                    <th>When</th>
                    <th>TxID</th>
                    <th>Amount</th>
                    <th>Destination</th>
                </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        );
    }

    private openTxnExplorer(event: any, txid: string) {
        event.preventDefault();
        const url = this.props.wallet.getExporerURL() + txid;
        console.log(`Opening ${url}`);
        shell.openExternal(url);
    }
}
