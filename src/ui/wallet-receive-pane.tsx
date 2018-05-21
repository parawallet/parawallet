import {observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {toast} from "react-toastify";
import {clipboard} from "electron";
import {WalletPaneProps} from "./wallet-pane";
import * as qrcode from "qrcode";

@observer
export class WalletReceivePane extends React.Component<WalletPaneProps, any> {
    @observable
    private addressQRCode: string;

    public constructor(props: WalletPaneProps) {
        super(props);

        qrcode.toDataURL(props.wallet.defaultAddress)
            .then((url: string) => {
                this.addressQRCode = url;
            });
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
                        </div>
                    </div>
                    <div className="row pt-5">
                        <div className="col-12">
                            <div className="btn-group float-left" role="group" aria-label="Basic example">
                                <button type="button" className="btn btn-outline-secondary btn-sm"
                                        onClick={() => this.copyAddress(address)}>
                                    <i className="fas fa-copy"/> Copy Address
                                </button>
                                <button type="button" className="btn btn-outline-secondary btn-sm"
                                        onClick={() => this.copyAddress(address)}>
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

    private copyAddress(address: string) {
        clipboard.writeText(address);
        toast.info(`Copied ${address} to clipboard.`, {autoClose: 2000});
    }
}
