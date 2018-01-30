

// tslint:disable:variable-name
export class Configuration {
  private readonly _btcConfig = new BtcConfig();
  private readonly _ethConfig = new EthConfig();

  public get btcConfig() {
    return this._btcConfig;
  }

  public get ethConfig() {
    return this._ethConfig;
  }
}

export class BtcConfig {

}

export class EthConfig {

}
