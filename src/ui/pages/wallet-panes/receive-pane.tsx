import {observable, reaction} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {toast} from "react-toastify";
import {clipboard, shell} from "electron";
import * as qrcode from "qrcode";
import {WalletTabPaneProps} from "../wallet-pane";

@observer
export class WalletReceivePane extends React.Component<WalletTabPaneProps, any> {
    @observable
    private addressQRCode: string;
    private reactionDisposer: () => void;
    private unmounted = false;

    public constructor(props: WalletTabPaneProps) {
        super(props);
        if (props.wallet.defaultAddress) {
            qrcode.toDataURL(props.wallet.defaultAddress)
                .then((url: string) => {
                    this.addressQRCode = url;
                });
        }
    }

    public componentDidMount(): void {
        this.reactionDisposer = reaction(
            () => this.props.wallet.defaultAddress,
            (address) => qrcode.toDataURL(address)
            .then((url: string) => {
                if (!this.unmounted) {
                    // do not update state if unmounted.
                    // we have this check since state is modified async here.
                    this.addressQRCode = url;
                }
            }),
        );
    }

    public componentWillUnmount() {
        this.reactionDisposer();
        this.unmounted = true;
    }

    public render() {
        const wallet = this.props.wallet;
        const address = wallet.defaultAddress;
        return (
            <div className="row">
                <div className="col-2">
                    <img src={this.addressQRCode} alt="Loading QRCode..."/>
                </div>
                <div className="col-8">
                    <div className="row">
                        <div className="col-12 receive_address_header">
                            Your {wallet.name} Address:
                        </div>
                        <div className="col-12 receive_address">
                            {address}
                            {wallet.getExporerURL("address") ?
                                (<a href="#" onClick={() => this.openAddressOnExplorer(address)}> <i
                                    className="fas fa-search" data-tip="Search the address on blockchain."/> </a>)
                                : ""}
                        </div>
                    </div>
                    <div className="row pt-5">
                        <div className="col-12">
                            <div className="btn-group float-left" role="group">
                                <button type="button" data-tip="Copy address to clipboard"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => this.copyAddress(address)}>
                                    <i className="fas fa-copy"/> Copy Address
                                </button>
                                <button type="button" data-tip="Change default address. Add new addresses."
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => this.props.showTab("addresses")}>
                                    <i className="fas fa-cog"/> Manage Addresses
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-100">
                    <hr/>
                </div>
            </div>
        );
    }

    private openAddressOnExplorer(address: string) {
        const url = this.props.wallet.getExporerURL("address") + address;
        shell.openExternal(url);
    }

    private copyAddress(address: string) {
        clipboard.writeText(address);
        toast.info(`Copied ${address} to clipboard.`, {autoClose: 2000});
    }
}
