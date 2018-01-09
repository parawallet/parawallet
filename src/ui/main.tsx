import * as React from "react";
import * as ReactDOM from "react-dom";
import { BtcAddressGenerator } from "../core/btc-address-gen";
import { BtcWallet } from "../core/btc-wallet";
import { BtcWalletTestnetRpc } from "../core/btc-wallet-rpc";
import { EthWallet } from "../core/eth-wallet";
import { IWallet } from "../core/wallet";
import * as db from "../db/secure-db";
import { Login, LoginCredentials } from "./login";
import { Page } from "./page";

class LoginState {
  public authenticated: boolean;
  public initialized: boolean;
}

class Main extends React.Component<any, LoginState> {
  private btcAddressGen: BtcAddressGenerator;
  private wallets: IWallet[] = [];

  constructor(props: any) {
    super(props);
    this.state = {authenticated: false, initialized: false};
  }

  public render() {
    if (!this.state.authenticated) {
      return (<Login onClick={(login: LoginCredentials) => this.onLogin(login)} />);
    } else if (!this.state.initialized) {
      return (
        <div style={{padding: "30px"}}>
          ...LOADING PAGE...
        </div>
      );
    } else {
      return this.renderPage();
    }
  }

  private onLogin(loginCreds: LoginCredentials) {
    const p = db.open(loginCreds.appPass);
    p.then(() => {
      console.log("DB is ready now -> " + db.get().hasOpened);
      this.setState({authenticated: true, initialized: false});

      this.btcAddressGen = new BtcAddressGenerator(db.get(), loginCreds.mnemonicPass);
      this.btcAddressGen.initialize()
        .then(() => this.setState({authenticated: true, initialized: true}));

    }, (e: Error) => {
      console.log(e);
      alert("Wrong password: " + e);
    });
  }

  private renderPage() {
    const BTC = new BtcWallet(this.btcAddressGen, new BtcWalletTestnetRpc());
    const ETH = new EthWallet();
    this.wallets.push(BTC, ETH);

    return (<Page defaultWalletCode={BTC.code} wallets={this.wallets} />);
  }
}

ReactDOM.render(<Main />, document.getElementById("root"));
