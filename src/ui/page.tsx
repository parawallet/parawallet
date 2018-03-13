import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import { toast } from "react-toastify";
import {Wallet, WalletType} from "../core/wallet";
import {Preferences, PreferencesMenu} from "./preferences";
import {PortfolioMenu} from "./portfolio-menu";
import {ExchangesMenu} from "./exchanges-menu";
import {WalletMenu} from "./wallet-menu";
import {WalletPane} from "./wallet-pane";
import {WalletAccount, WalletStore} from "./wallet-store";
import {TimelineChart} from "./timeline-chart";
import {PieChart} from "./pie-chart";

interface PageProps {
    readonly defaultWalletCode: string;
    readonly wallets: Wallet[];
}

export enum PaneId { PANE_TIMELINE, PANE_PERCENTAGES, PANE_WALLET, PANE_PREF }

@observer
export class Page extends React.Component<PageProps, any> {
    private walletsStore: WalletStore;
    private timerID: NodeJS.Timer;
    @observable
    private activePaneId: PaneId = PaneId.PANE_TIMELINE;

    constructor(props: PageProps) {
        super(props);
        this.walletsStore = new WalletStore(props.wallets, props.defaultWalletCode);
    }

    public componentDidMount() {
        this.updateActiveBalance();
        this.timerID = setInterval(() => this.updateActiveBalance(), 30000);
    }

    public componentWillUnmount() {
        clearInterval(this.timerID);
    }

    public render() {
        let activePane;
        switch ( this.activePaneId ) {
            case PaneId.PANE_TIMELINE: {
                activePane = <TimelineChart/>;
                break;
            }
            case PaneId.PANE_PERCENTAGES: {
                activePane = <PieChart/>;
                break;
            }
            case PaneId.PANE_WALLET: {
                const account = this.walletsStore.activeAccount;
                activePane = <WalletPane account={account} />;
                break;
            }
            case PaneId.PANE_PREF: {
                activePane = <Preferences/>;
                break;
            }
            default: {
                break;
            }
        }

        return (
            <div className="pane-group">
                <div className="pane-sm sidebar">
                    <PortfolioMenu onMenuClick={(paneId: PaneId) => this.showPane(paneId)}/>
                    <WalletMenu wallets={this.props.wallets} onMenuClick={(wlt) => this.switchWallet(wlt)}/>
                    <ExchangesMenu/>
                    <PreferencesMenu onClick={() => this.activePaneId = PaneId.PANE_PREF}/>
                </div>
                <div className="pane">
                    {activePane}
                </div>
            </div>
        );
    }

    private showPane(paneId: PaneId) {
        this.activePaneId = paneId;
    }

    private switchWallet(wallet: WalletType) {
        console.log(`Switching wallet: ${wallet.code}`);
        this.activePaneId = PaneId.PANE_WALLET;
        const account = this.walletsStore.switchWallet(wallet.code);
        if (account.isEmpty) {
            this.updateBalance(account);
        }
    }

    private updateActiveBalance() {
        if (this.activePaneId === PaneId.PANE_WALLET) {
            this.updateBalance(this.walletsStore.activeAccount);
        }
    }

    private async updateBalance(walletAccount: WalletAccount) {
        try {
            await walletAccount.update();
        } catch (error) {
            toast.error(JSON.stringify(error));
        }
    }
}
