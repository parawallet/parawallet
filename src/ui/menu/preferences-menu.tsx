import * as React from "react";
import {PaneId} from "../page";

interface IPreferencesMenuProps {
    onMenuClick(paneId: PaneId): void;
}

export class PreferencesMenu extends React.Component<IPreferencesMenuProps, any> {
    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <div>
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                    <span>Preferences</span>
                </h6>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={() => this.props.onMenuClick(PaneId.PANE_SECURITY)}>
                            <i className="fas fa-unlock-alt menu-icon" />
                            Security
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" onClick={() => this.props.onMenuClick(PaneId.PANE_BACKUP)}>
                            <i className="fas fa-undo menu-icon" />
                            Backup
                        </a>
                    </li>
                </ul>
            </div>
        );
    }
}
