import * as React from "react";

export class ToolsMenu extends React.Component {
    render() {
        return (
            <nav className="nav-group">
                <h5 className="nav-group-title">Tools Menu</h5>
                <a className="nav-group-item">
                    <span className="icon icon-home" />
                    Exchange
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
    Gemini
        </span>
            </nav>
        );
    }
}
