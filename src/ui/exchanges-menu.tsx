import * as React from "react";

export class ExchangesMenu extends React.Component {
  public render() {
    return (
      <nav className="nav-group">
        <h5 className="nav-group-title">Exchanges</h5>
        <a className="nav-group-item">
          <span className="icon icon-home" />
                    Shapeshift
        </a>
        <span className="nav-group-item">
          <span className="icon icon-download" />
    Coinbase
        </span>
        <span className="nav-group-item">
          <span className="icon icon-print" />
    Bittrex
        </span>
        <span className="nav-group-item">
          <span className="icon icon-cloud" />
    Binance
        </span>
      </nav>
    );
  }
}
