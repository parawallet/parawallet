import {observer} from "mobx-react";
import * as React from "react";
import * as ReactTooltip from "react-tooltip";
import {Wallet} from "../wallets";
import {PaneHeader} from "../pane-header";
import {WalletSendPane} from "./wallet-panes/send-pane";
import {WalletAddressesPane} from "./wallet-panes/addresses-pane";
import {WalletTransactionsPane} from "./wallet-panes/transactions-pane";
import {WalletReceivePane} from "./wallet-panes/receive-pane";

interface WalletPaneProps {
    readonly wallet: Wallet;
}

export interface WalletTabPaneProps extends WalletPaneProps {
    readonly showTab: (tabName: string) => void;
}

const sendRefName = "send";
const receiveRefName = "receive";
const addressesRefName = "addresses";
const transactionsRefName = "transactions";

@observer
export class WalletPane extends React.Component<WalletPaneProps, any> {
    private readonly tabs = {} as { [key: string]: HTMLElement | null };

    constructor(props: WalletPaneProps) {
        super(props);
        this.showTab = this.showTab.bind(this);
    }

    public componentDidUpdate() {
        ReactTooltip.rebuild();
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
                            ref={(tab) => this.tabs[sendRefName] = tab}
                           aria-controls="send" aria-selected="true">Send</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="receive-tab" data-toggle="tab" href="#receive" role="tab"
                            ref={(tab) => this.tabs[receiveRefName] = tab}
                           aria-controls="receive" aria-selected="false">Receive</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="addresses-tab" data-toggle="tab" href="#addresses" role="tab"
                            ref={(tab) => this.tabs[addressesRefName] = tab}
                           aria-controls="addresses" aria-selected="false">Addresses</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="transactions-tab" data-toggle="tab" href="#transactions" role="tab"
                            ref={(tab) => this.tabs[transactionsRefName] = tab}
                           aria-controls="transactions" aria-selected="false">Transactions</a>
                    </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                    <div className="tab-pane fade show active" id="send" role="tabpanel" aria-labelledby="send-tab">
                        <WalletSendPane wallet={wallet} showTab={this.showTab} />
                    </div>
                    <div className="tab-pane fade" id="receive" role="tabpanel" aria-labelledby="receive-tab">
                        <WalletReceivePane wallet={wallet} showTab={this.showTab} />
                    </div>
                    <div className="tab-pane fade" id="addresses" role="tabpanel" aria-labelledby="addresses-tab">
                        <WalletAddressesPane wallet={wallet} showTab={this.showTab} />
                    </div>
                    <div className="tab-pane fade" id="transactions" role="tabpanel" aria-labelledby="transactions-tab">
                        <WalletTransactionsPane wallet={wallet} showTab={this.showTab} />
                    </div>
                </div>
                <ReactTooltip />
            </div>
        );
    }

    public showTab(tabName: string) {
        const tabElement: any = this.tabs[tabName];
        if (!tabElement) {
            throw new Error(`Invalid tab: ${tabName}`);
        }
        ($(tabElement) as any).tab("show");
    }
}
