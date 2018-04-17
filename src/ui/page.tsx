import {observable, reaction} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import { toast } from "react-toastify";
import {Wallet, WalletType} from "../core/wallet";
import {SecurityPane, PreferencesMenu, BackupPane} from "./preferences";
import {PortfolioMenu} from "./portfolio-menu";
import {ExchangesMenu} from "./exchanges-menu";
import {WalletMenu} from "./wallet-menu";
import {WalletPane} from "./wallet-pane";
import {WalletStore} from "./wallet-store";
import {TimelineChart} from "./timeline-chart";
import {PieChart} from "./pie-chart";
import {PortfolioStore} from "../core/portfolio";

interface PageProps {
    readonly portfolioStore: PortfolioStore;
    readonly defaultWalletCode: string;
    readonly wallets: Wallet[];
    readonly mnemonics: string;
}

export enum PaneId { PANE_TIMELINE, PANE_PERCENTAGES, PANE_WALLET, PANE_SECURITY , PANE_BACKUP}

@observer
export class Page extends React.Component<PageProps, any> {
    private walletStore: WalletStore;
    private timerID: NodeJS.Timer;
    @observable
    private activePaneId: PaneId = PaneId.PANE_TIMELINE;
    private portfolioStore: PortfolioStore;
    private mnemonics: string;

    constructor(props: PageProps) {
        super(props);
        this.walletStore = new WalletStore(props.wallets, props.defaultWalletCode);
        this.portfolioStore = props.portfolioStore;
        this.mnemonics = props.mnemonics;
    }

    public componentDidMount() {
        // Update portfolio when total balance of any wallet changes
        reaction(() => this.walletStore.allWallets.map((wa) => wa.totalBalanceAmount),
            () => this.portfolioStore.updateLastRecord());

        this.timerID = setInterval(() => this.updateActiveBalance(), 30000);
    }

    public componentWillUnmount() {
        clearInterval(this.timerID);
    }

    public render() {
        let activePane;
        switch ( this.activePaneId ) {
            case PaneId.PANE_TIMELINE: {
                activePane = <TimelineChart portfolioStore={this.portfolioStore}/>;
                break;
            }
            case PaneId.PANE_PERCENTAGES: {
                activePane = <PieChart portfolioStore={this.portfolioStore}/>;
                break;
            }
            case PaneId.PANE_WALLET: {
                const wallet = this.walletStore.activeWallet;
                activePane = <WalletPane wallet={wallet} />;
                break;
            }
            case PaneId.PANE_SECURITY: {
                activePane = <SecurityPane/>;
                break;
            }
            case PaneId.PANE_BACKUP: {
                activePane = <BackupPane mnemonics={this.mnemonics}/>;
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
                    <PreferencesMenu onMenuClick={(paneId: PaneId) => this.activePaneId = paneId}/>
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

    private switchWallet(walletType: WalletType) {
        console.log(`Switching wallet: ${walletType.code}`);
        this.activePaneId = PaneId.PANE_WALLET;
        this.walletStore.switchWallet(walletType.code);
    }

    private updateActiveBalance() {
        if (this.activePaneId === PaneId.PANE_WALLET) {
            this.updateBalance(this.walletStore.activeWallet);
        }
    }

    private async updateBalance(wallet: Wallet) {
        try {
            await wallet.updateBalances();
        } catch (error) {
            toast.error(JSON.stringify(error));
        }
    }
}
