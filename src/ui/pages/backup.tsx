import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import {PaneHeader} from "../pane-header";


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
            <div>
                <PaneHeader title="Backup" icon={"fas fa-undo"}
                            subtitle={"12 Word Backup Phrase"}/>
                <div className="alert alert-primary" role="alert">
                    <i className="fas fa-info-circle" />

                <span className="important_note">Important notes about 12 word backup phrase</span><br/>
                <ul>
                    <li>In case, you lost your computer, you can restore your wallet entering 12 word backup phrase.</li>
                    <li>Ensure no one can see your screen before phrase is displayed.</li>
                    <li>Do not take photo or do not store it digitally a device that has internet connection.</li>
                    <li>Write down the phrase to a paper. Store paper inside a safe deposit box or vault.</li>
                    <li>In case your forget or lose, it is better to keep multiple copies in different places.</li>
                    <li>Do not share your backup phrase with anyone. One can acquire all of your funds using backup phrase.</li>
                </ul>
                </div>
                <button type="button" className="btn btn-outline-primary"
                        onClick={() => this.showMnemonics = true}>Show Backup Phrase</button>
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
