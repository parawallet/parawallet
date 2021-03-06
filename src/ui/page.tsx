import {observable, reaction} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {toast} from "react-toastify";
import {remote} from "electron";
import {Wallet, WalletType} from "./wallets";
import {PreferencesMenu} from "./menu/preferences-menu";
import {PortfolioMenu} from "./menu/portfolio-menu";
import {ExchangesMenu} from "./menu/exchanges-menu";
import {WalletMenu} from "./menu/wallet-menu";
import {WalletPane} from "./pages/wallet-pane";
import {WalletStore} from "./wallet-store";
import {TimelineChart} from "./pages/portfolio-timeline-chart";
import {PieChart} from "./pages/portfolio-pie-chart";
import {PortfolioStore} from "../core/portfolio";
import {stringifyErrorMessageReplacer} from "../util/errors";
import {BackupPane} from "./pages/backup";
import {SecurityPane} from "./pages/security";
import { isProductionBuild } from "../runtime-args";

interface PageProps {
    readonly portfolioStore: PortfolioStore;
    readonly defaultWalletCode: string;
    readonly wallets: Wallet[];
    readonly mnemonics: string;
}

export enum PaneId { PANE_TIMELINE, PANE_PERCENTAGES, PANE_WALLET, PANE_SECURITY, PANE_BACKUP}

@observer
export class Page extends React.Component<PageProps, any> {
    private walletStore: WalletStore;
    private timerID: NodeJS.Timer;
    @observable
    private activePaneId: PaneId = PaneId.PANE_TIMELINE;
    private portfolioStore: PortfolioStore;
    private mnemonics: string;
    private reactionDisposer: () => void;

    constructor(props: PageProps) {
        super(props);
        this.walletStore = new WalletStore(props.wallets, props.defaultWalletCode);
        this.portfolioStore = props.portfolioStore;
        this.mnemonics = props.mnemonics;
    }

    public componentDidMount() {
        // Update portfolio when total balance of any wallet changes
        this.reactionDisposer = reaction(() => this.walletStore.allWallets.map((wa) => wa.totalBalanceAmount),
                () => this.portfolioStore.updateLastRecord());
        this.timerID = setInterval(() => this.updateActiveBalance(), 30000);
    }

    public componentWillUnmount() {
        clearInterval(this.timerID);
        this.reactionDisposer();
    }

    public render() {
        let activePane;
        switch (this.activePaneId) {
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
                activePane = <WalletPane wallet={wallet}/>;
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
            <div>
                <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                    <span className="navbar-brand col-sm-3 col-md-2 mr-0">
                        <img src="images/wallet_logo_inv.png" className="nav-logo"/>
                    </span>
                    <div className="navbar-nav px-3">
                        <span className="nav-link">{isProductionBuild(remote.process) ? "PROD" : "TEST"} - Version {remote.app.getVersion()}</span>
                    </div>
                </nav>


                <div className="container-fluid">
                    <div className="row">
                        <nav className="col-md-2 d-none d-md-block bg-light sidebar">
                            <div className="sidebar-sticky">
                                <ul className="nav flex-column">
                                    <PortfolioMenu onMenuClick={(paneId: PaneId) => this.showPane(paneId)}/>
                                    <WalletMenu wallets={this.props.wallets}
                                                onMenuClick={(wlt) => this.switchWallet(wlt)}/>
                                    <ExchangesMenu/>
                                    <PreferencesMenu
                                        onMenuClick={(paneId: PaneId) => this.activePaneId = paneId}/>
                                </ul>
                            </div>
                        </nav>
                        <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-4">
                            {activePane}
                        </main>
                    </div>
                </div>

            </div>
        );
    }


    private showPane(paneId: PaneId) {
        this.activePaneId = paneId;
    }

    private switchWallet(walletType: WalletType) {
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
            toast.error(JSON.stringify(error, stringifyErrorMessageReplacer));
        }
    }
}
