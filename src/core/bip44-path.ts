// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki

const template = "m/44'/cointype'/account'/chaintype/index";

export enum ChainType {
  EXTERNAL = "0",
  CHANGE = "1",
}

// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
export enum CoinType {
  BTC = "0",
  TEST= "1",
  LTC = "2",
  // ...
  ETC = "60",
}

export function generatePath(cointType: CoinType, chainType: ChainType, index: number) {
  return template
    .replace(/cointype/, cointType)
    .replace(/account/, "0")
    .replace(/chaintype/, chainType)
    .replace(/index/, index.toString());
}
