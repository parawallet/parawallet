import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {IWallet, IWalletType} from "../core/wallet";
import {Preferences, PreferencesMenu} from "./preferences";
import {ToolsMenu} from "./tools-menu";
import {WalletMenu} from "./wallet-menu";
import {WalletPane} from "./wallet-pane";
import {WalletAccount, WalletStore} from "./wallet-store";

interface IPageProps {
    readonly defaultWalletCode: string;
    readonly wallets: IWallet[];
}

enum PaneId { PANE_WALLET, PANE_PREF }

@observer
export class Page extends React.Component<IPageProps, any> {
    private walletsStore: WalletStore;
    private timerID: NodeJS.Timer;
    @observable
    private activePaneId: PaneId = PaneId.PANE_WALLET;

    constructor(props: IPageProps) {
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
        const account = this.walletsStore.activeAccount;
        let activePane;

        switch ( this.activePaneId ) {
            case PaneId.PANE_WALLET: {
                activePane = <WalletPane wallet={account.wallet} address={account.address} balance={account.balance}/>;
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
                    <WalletMenu wallets={this.props.wallets} onClick={(wlt) => this.switchWallet(wlt)}/>
                    <ToolsMenu/>
                    <PreferencesMenu onClick={() => this.activePaneId = PaneId.PANE_PREF}/>
                </div>
                <div className="pane">
                    {activePane}
                </div>
            </div>
        );
    }

    private switchWallet(wallet: IWalletType) {
        console.log(`Switching wallet: ${wallet.code}`);
        this.activePaneId = PaneId.PANE_WALLET;
        const account = this.walletsStore.switchWallet(wallet.code);
        if (account.address === WalletAccount.NA_ADDRESS) {
            this.updateBalance(account.wallet);
        }
    }

    private updateActiveBalance() {
        if (this.activePaneId === PaneId.PANE_WALLET) {
            this.updateBalance(this.walletsStore.activeWallet);
        }
    }

    private updateBalance(wallet: IWallet) {
        wallet.update((address, balance) => {
            const walletAccount = this.walletsStore.getWalletAccount(wallet.code);
            walletAccount.update(address, balance);
        });
    }
}
