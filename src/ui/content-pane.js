import * as React from "react";

export class ContentPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {address: "mq3ce8CE4jmyg5a8Y4HqcPtnLRGJu9qhHf", amount: "1000000"};

    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleAmountChange(event) {
    this.setState({amount: event.target.value});
  }

  handleAddressChange(event) {
    this.setState({address: event.target.value});
  }

  handleSubmit(event) {
    this.props.wallet.send(this.state.address, Number(this.state.amount), (address, balance) => {
      this.setBalance(address, balance);
    });
    event.preventDefault();
  }

  render() {
    return (
      <div style={{padding: "30px"}}>
        <h1>
          <i className={"icon cc " + this.props.wallet.code} title={this.props.wallet.code} />
          {this.props.wallet.name} </h1>
        <span className="coin_header">Balance: <span
          id={this.props.wallet.code + "-balance"} /> {this.props.wallet.code}</span>

        <hr />
        <h5>Receive {this.props.wallet.name}:</h5>
                Your Address: <span
          id={this.props.wallet.code + "-address"} />

        <hr />
        <h5>Send {this.props.wallet.name}:</h5>

        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label>To Address:</label>
            <input type="text" className="form-control" name="address"
              value={this.state.address} onChange={this.handleAddressChange} />
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input type="text" className="form-control" name="amount"
              value={this.state.amount} onChange={this.handleAmountChange} />
          </div>
          <div className="form-actions">
            <input className="btn btn-large btn-default" type="submit" value="Submit" />
          </div>
        </form>

      </div>
    );
  }
}
