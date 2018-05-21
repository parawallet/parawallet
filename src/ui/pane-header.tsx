import * as React from "react";

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
                    <h3 className="h3">
                        {this.props.icon === null ? "" : <i className={this.props.icon + " pane-header-icon"} />}
                        {this.props.title}
                        </h3>
                </div>
                <h6>{this.props.subtitle}</h6>
            </div>
        );
    }
}
