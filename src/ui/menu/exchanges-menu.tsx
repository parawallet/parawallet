import * as React from "react";
import {toast} from "react-toastify";

export class ExchangesMenu extends React.Component {
  public render() {
    return (
        <div>
            <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                <span>Exchanges</span>
            </h6>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <a className="nav-link" href="#" onClick={this.notSupported}>
                        <i className="fas fa-exchange-alt menu-icon" />
                        Shapeshift
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#" onClick={this.notSupported}>
                        <i className="fas fa-exchange-alt menu-icon" />
                        Coinbase
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#" onClick={this.notSupported}>
                        <i className="fas fa-exchange-alt menu-icon" />
                        Binance
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#" onClick={this.notSupported}>
                        <i className="fas fa-exchange-alt menu-icon" />
                        Bittrex
                    </a>
                </li>
            </ul>
        </div>
    );
  }

  private notSupported() {
    toast.warn("Exchanges support are not ready yet!", {autoClose: 2000});
  }
}
