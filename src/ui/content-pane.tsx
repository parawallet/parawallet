import * as React from "react";
import { IWallet } from "../core/wallet";

interface IContentPaneProps {
  readonly wallet: IWallet;
  readonly address: string;
  readonly balance: number;
}

export class ContentPane extends React.Component<IContentPaneProps, any> {
  public render() {
    const wallet = this.props.wallet;
    return (
      <div style={{padding: "30px"}}>
        <h1>
          <i className={"icon cc " + wallet.code} title={wallet.code} />
          {wallet.name}
        </h1>
        <span className="coin_header">
          Balance: {this.props.balance} {wallet.code}
        </span>

        <hr />
        <h5>Receive {wallet.name}:</h5> Your Address: {this.props.address}

        <hr />
        <TransferPane wallet={wallet}/>
      </div>
    );
  }
}

interface ITransferPaneProps {
  readonly wallet: IWallet;
}

class TransferState {
  public readonly address: string;
  public readonly amount: number | string;

  constructor(address: string, amount: number | string) {
    this.address = address;
    this.amount = amount;
  }
}

class TransferPane extends React.Component<ITransferPaneProps, TransferState> {
  public constructor(props: ITransferPaneProps) {
    super(props);
    this.state = new TransferState("mq3ce8CE4jmyg5a8Y4HqcPtnLRGJu9qhHf", 1000000);

    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public render() {
    return (
      <div>
        <h5>Send {this.props.wallet.name}:</h5>

        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label>To Address:</label>
            <input type="text" className="form-control" value={this.state.address} onChange={this.handleAddressChange}/>
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input type="text" className="form-control" value={this.state.amount} onChange={this.handleAmountChange} />
          </div>
          <div className="form-actions">
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
          </div>
        </form>
      </div>
    );
  }

  private handleAmountChange(event: React.FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    this.setState((prevState, props) => {
      return new TransferState(prevState.address, target.value);
    });
  }

  private handleAddressChange(event: React.FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    this.setState((prevState, props) => {
      return new TransferState(target.value, prevState.amount);
    });
  }

  private handleSubmit(event: React.FormEvent<any>) {
    this.props.wallet.send(this.state.address, Number(this.state.amount), (address, balance) => {
      // TODO: update balance in main UI
    });
    event.preventDefault();
  }
}
