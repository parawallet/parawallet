import * as React from "react";
import {WalletType} from "../wallets";

interface IWalletMenuProps {
    readonly wallets: WalletType[];

    onMenuClick(wallet: WalletType): void;
}

export class WalletMenu extends React.Component<IWalletMenuProps, any> {
    public render() {
        return (
            <div>
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                    <span>Wallets</span>
                </h6>
                <ul className="nav flex-column">
                    {this.props.wallets.map((wlt) =>
                        <WalletMenuItem wallet={wlt} onClick={() => this.props.onMenuClick(wlt)} key={wlt.code}/>,
                    )}
                </ul>
            </div>
        );
    }
}

interface IWalletMenuItemProps {
    readonly wallet: WalletType;

    onClick(): void;
}

class WalletMenuItem extends React.Component<IWalletMenuItemProps, any> {
    public render() {
        return (
            <li className="nav-item">
                <a className="nav-link" href="#" onClick={this.props.onClick}>
                    <i className={"cc " + this.props.wallet.code + " menu-icon"} title={this.props.wallet.code}/>
                    {this.props.wallet.name}
                </a>
            </li>
        );
    }
}
