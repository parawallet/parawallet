import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { toast } from "react-toastify";
import {TotpRemove, TotpSetup, totpValidator} from "../totp";
import {PaneHeader} from "../pane-header";
import { loggers } from "../../util/logger";

@observer
export class SecurityPane extends React.Component<any, any> {
    @observable
    private showTotpSetup = false;
    @observable
    private showRemoveTotp = false;

    constructor(props: any) {
        super(props);
        this.resetState = this.resetState.bind(this);
        this.handle2FA = this.handle2FA.bind(this);
        this.changeLoggingLevel = this.changeLoggingLevel.bind(this);
    }

    public render() {
        let content;
        if (this.showTotpSetup) {
            content = (<TotpSetup onValidToken={this.resetState}/>);
        } else if (this.showRemoveTotp) {
            content = (<TotpRemove onRemove={this.resetState}/>);
        } else {
            content = this.renderPrefs();
        }
        return (
            <div>
                <PaneHeader title="Security" icon={"fas fa-unlock-alt"}
                            subtitle={"Authentication Options"}/>
                {content}
            </div>
        );
    }

    private renderPrefs() {
        return (
            <div>
                <div className="form-group" style={{paddingTop: "15px"}}>
                    <label>Two-Factor Authentication:</label>
                    <br/>
                    <input className="btn btn-outline-primary btn-sm" type="button"
                           value={totpValidator.enabled ? "Disable" : "Enable"} onClick={this.handle2FA}/>
                </div>

                <div className="form-group" style={{paddingTop: "15px"}}>
                    <label>Logging Level:</label>
                    <br/>
                    <select className="form-control" defaultValue={loggers.level} onChange={this.changeLoggingLevel} style={{width: "200px"}}>
                        <option value="off" key="off">Off</option>
                        <option value="error" key="error">Error</option>
                        <option value="warn" key="warn">Warning</option>
                        <option value="info" key="info">Info</option>
                        <option value="debug" key="debug">Debug</option>
                    </select>
                </div>
            </div>
        );
    }

    private handle2FA() {
        if (totpValidator.enabled) {
            this.showRemoveTotp = true;
        } else {
            this.showTotpSetup = true;
        }
    }

    private resetState() {
        this.showRemoveTotp = false;
        this.showTotpSetup = false;
    }

    private changeLoggingLevel(event: any) {
        event.preventDefault();
        const level = event.target.value;
        loggers.level = level;
        toast.info(`Logging level changed to ${level}.`, {autoClose: 1000});
    }
}
