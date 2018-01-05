import * as React from "react";
import { IWallet } from "../core/wallet";

interface IWalletMenuProps {
  readonly wallets: IWallet[];
  onClick(wallet: IWallet): void;
}

export class WalletMenu extends React.Component<IWalletMenuProps, any> {
  public render() {
    return (
      <nav className="nav-group">
        <h5 className="nav-group-title">Funds</h5>
        {this.props.wallets.map((wlt) =>
          <WalletMenuItem wallet={wlt} onClick={() => this.props.onClick(wlt)} key={wlt.code} />,
        )}
      </nav>
    );
  }
}

interface IWalletMenuItemProps {
  readonly wallet: IWallet;
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
