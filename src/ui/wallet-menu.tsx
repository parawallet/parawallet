import * as React from "react";
import { IWalletType } from "../core/wallet";

interface IWalletMenuProps {
  readonly wallets: IWalletType[];
  onMenuClick(wallet: IWalletType): void;
}

export class WalletMenu extends React.Component<IWalletMenuProps, any> {
  public render() {
    return (
      <nav className="nav-group">
        <h5 className="nav-group-title">Wallets</h5>
        {this.props.wallets.map((wlt) =>
          <WalletMenuItem wallet={wlt} onClick={() => this.props.onMenuClick(wlt)} key={wlt.code} />,
        )}
      </nav>
    );
  }
}

interface IWalletMenuItemProps {
  readonly wallet: IWalletType;
  onClick(): void;
}

class WalletMenuItem extends React.Component<IWalletMenuItemProps, any> {
  public render() {
    return (
      <a className="nav-group-item" onClick={this.props.onClick}>
        <i className={"icon cc " + this.props.wallet.code} title={this.props.wallet.code} />
        {this.props.wallet.name}
      </a>
    );
  }
}
