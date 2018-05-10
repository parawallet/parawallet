import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import {TotpRemove, TotpSetup, totpValidator} from "./totp";
import {PaneHeader} from "./pane-header";


export class SecurityPane extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.resetState = this.resetState.bind(this);
        this.handle2FA = this.handle2FA.bind(this);
        this.state = {showTotpSetup: false, showRemoveTotp: false};
    }

    public render() {
        let content;
        if (this.state.showTotpSetup) {
            content = (<TotpSetup onValidToken={this.resetState}/>);
        } else if (this.state.showRemoveTotp) {
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
