import * as React from "react";

export class WalletMenu extends React.Component {
  render() {
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

class WalletMenuItem extends React.Component {
  render() {
    return (
      <a className="nav-group-item" onClick={() => this.props.onClick()}>
        <i className={"icon cc " + this.props.wallet.code} title={this.props.wallet.code} />
        {this.props.wallet.name}
      </a>
    );
  }
}
