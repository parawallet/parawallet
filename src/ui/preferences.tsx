import * as React from "react";
import {TotpRemove, TotpSetup, totpValidator} from "./totp";
import {PaneId} from "./page";
import { observable } from "mobx";
import { observer } from "mobx-react";


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

@observer
export class BackupPane extends React.Component<any, any> {
    @observable
    private showMnemonics: boolean = false;
    private readonly mnemonics: string;

    constructor(props: any) {
        super(props);
        this.mnemonics = props.mnemonics;
    }

    public render() {
        return(
            <div className="paneContentDiv">
                <h3>Backup</h3>
                <hr/>
                <span className="important_note">Important notes about 12 word backup phrase</span><br/>
                <ul>
                    <li>In case, you lost your computer, you can restore your wallet entering 12 word backup phrase.</li>
                    <li>Ensure no one can see your screen before phrase is displayed.</li>
                    <li>Do not take photo or do not store it digitally a device that has internet connection.</li>
                    <li>Write down the phrase to a paper. Store paper inside a safe deposit box or vault.</li>
                    <li>In case your forget or lose, it is better to keep multiple copies in different places.</li>
                    <li>Do not share your backup phrase with anyone. One can acquire all of your funds using backup phrase.</li>
                </ul>
                <br/>
                <button onClick={() => this.showMnemonics = true}>Show Backup Phrase</button>
                <br/>
                {this.renderMnemonics()}
            </div>
        );
    }

    private renderMnemonics() {
        if (!this.showMnemonics) {
            return null;
        }
        return (
            <div className="mnemonics">{this.mnemonics}</div>
        );
    }
}

export class SecurityPane extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.resetState = this.resetState.bind(this);
        this.handle2FA = this.handle2FA.bind(this);
        this.state = {showTotpSetup: false, showRemoveTotp: false};
    }

    public render() {
        if (this.state.showTotpSetup) {
            return (<TotpSetup onValidToken={this.resetState}/>);
        }
        if (this.state.showRemoveTotp) {
            return (<TotpRemove onRemove={this.resetState}/>);
        }
        return this.renderPrefs();
    }

    private renderPrefs() {
        return (
            <div style={{padding: "30px"}}>
                <div className="form-group">
                    <label>Two-Factor Authentication:</label>
                    <input className="btn btn-default" type="button"
                           value={totpValidator.enabled ? "Disable" : "Enable"} onClick={this.handle2FA}/>
                </div>
                <hr/>
            </div>
        );
    }

    private handle2FA() {
        if (totpValidator.enabled) {
            this.setState({showRemoveTotp: true});
        } else {
            this.setState({showTotpSetup: true});
        }
    }

    private resetState() {
        this.setState({showTotpSetup: false, showRemoveTotp: false});
    }
}
