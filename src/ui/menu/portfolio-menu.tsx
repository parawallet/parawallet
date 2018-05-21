import * as React from "react";
import {PaneId} from "../page";


interface IPortfolioMenuProps {
    onMenuClick(paneId: PaneId): void;
}

export class PortfolioMenu extends React.Component<IPortfolioMenuProps, any> {
    public render() {
        return (
            <div>
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                    <span>Portfolio</span>
                </h6>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={() => this.props.onMenuClick(PaneId.PANE_TIMELINE)}>
                            <i className="fas fa-chart-line menu-icon" />
                            Timeline
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={() => this.props.onMenuClick(PaneId.PANE_PERCENTAGES)}>
                            <i className="fas fa-chart-pie menu-icon" />
                            Percentages
                        </a>
                    </li>
                </ul>
            </div>
        );
    }
}
