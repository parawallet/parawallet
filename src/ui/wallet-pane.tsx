import {computed, observable, reaction, action} from "mobx";
import {observer} from "mobx-react";
import {clipboard, shell} from "electron";
import * as React from "react";
import * as Modal from "react-modal";
import {toast} from "react-toastify";
import {Wallet} from "../core/wallet";
import {WalletSendPane} from "./wallet-send-pane";
import {PaneHeader} from "./pane-header";
import * as ReactTooltip from "react-tooltip";
import {WalletAddressesPane} from "./wallet-addresses-pane";
import {WalletTransactionsPane} from "./wallet-transactions-pane";
import {WalletReceivePane} from "./wallet-receive-pane";

export interface WalletPaneProps {
    readonly wallet: Wallet;
}

@observer
export class WalletPane extends React.Component<WalletPaneProps, any> {
    @observable
    private showEmptyAccounts: boolean = false;
    private addressTab: any;

    constructor(props: WalletPaneProps) {
        super(props);
    }

    public render() {
        const wallet = this.props.wallet;
        return (
            <div>
                <PaneHeader title={wallet.name} icon={"icon cc " + wallet.code}
                            subtitle={"Current Balance: " + wallet.totalBalanceAmount + wallet.code}/>

                <ul className="nav nav-tabs wallet-tabs" id="myTab" role="tablist">
                    <li className="nav-item">
                        <a className="nav-link active" id="send-tab" data-toggle="tab" href="#send" role="tab"
                           aria-controls="send" aria-selected="false">Send</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="receive-tab" data-toggle="tab" href="#receive" role="tab"
                           aria-controls="receive" aria-selected="false">Receive</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="addresses-tab" data-toggle="tab" href="#addresses" role="tab"
                           aria-controls="addresses" aria-selected="false">Addresses</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="transactions-tab" data-toggle="tab" href="#transactions" role="tab"
                           aria-controls="transactions" aria-selected="false">Transactions</a>
                    </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                    <div className="tab-pane fade show active" id="send" role="tabpanel" aria-labelledby="send-tab">
                        <WalletSendPane wallet={wallet} />
                    </div>
                    <div className="tab-pane fade" id="receive" role="tabpanel" aria-labelledby="receive-tab">
                        <WalletReceivePane wallet={wallet} />
                    </div>
                    <div className="tab-pane fade" id="addresses" role="tabpanel" ref={(addressTab) => this.addressTab = addressTab}
                         aria-labelledby="addresses-tab">
                        <WalletAddressesPane wallet={wallet}/>
                    </div>
                    <div className="tab-pane fade" id="transactions" role="tabpanel" aria-labelledby="transactions-tab">
                        <WalletTransactionsPane wallet={wallet} />
                    </div>
                </div>
                <ReactTooltip />
            </div>
        );
    }
}
