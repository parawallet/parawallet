import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import {clipboard} from "electron";
import * as React from "react";
import * as Modal from "react-modal";
import { toast } from "react-toastify";
import {Wallet} from "../core/wallet";
import {TransferPane} from "./transfer-pane";


interface PaneHeaderProps {
    readonly title: string;
    readonly subtitle: string;
    readonly icon: string;
}

export class PaneHeader extends React.Component<PaneHeaderProps, any> {

    constructor(props: PaneHeaderProps) {
        super(props);
    }

    public render() {
        return (
            <div>
                <div
                    className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h3 className="h3">{this.props.title}</h3>
                </div>
                <h6>{this.props.subtitle}</h6>
            </div>
        );
    }
}