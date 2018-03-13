import * as React from "react";
import {PaneId} from "./page";


interface IPortfolioMenuProps {
    onMenuClick(paneId: PaneId): void;
}

export class PortfolioMenu extends React.Component<IPortfolioMenuProps, any> {
    public render() {
        return (
            <nav className="nav-group">
                <h5 className="nav-group-title">Portfolio</h5>
                    <a className="nav-group-item" onClick={() => this.props.onMenuClick(PaneId.PANE_TIMELINE)}>
                        <span className="icon icon-chart-line"/>
                        Timeline
                    </a>
                    <a className="nav-group-item" onClick={() => this.props.onMenuClick(PaneId.PANE_PERCENTAGES)}>
                        <span className="icon icon-chart-pie"/>
                        Percentages
                    </a>
            </nav>
        );
    }
}
