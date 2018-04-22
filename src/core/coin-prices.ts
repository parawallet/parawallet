import * as request from "request";

const coinPrices = new Map<string, number>();

export function getPrice(dateStr: string, coin: string): Promise<any> {
    const key = coin + dateStr;
    const value = coinPrices.get(key);
    if (value) {
        return Promise.resolve(value);
    }

    const url: string = "http://mindeet.com/admin/operation/coinPrice/prices?coinType=" + coin + "&start=" + dateStr + "&end=" + dateStr;
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            const result: any = JSON.parse(body);
            if (result == null || result.length < 1) {
                // todo throw exception, do not show chart. user should not see incorrect balance.
                console.error("No price from web service for:" + key);
                resolve(-1);
            } else {
                const priceUsd = result[0].price_usd;
                coinPrices.set(key, priceUsd);
                resolve(priceUsd);
            }
        });
    });
}

export function cacheThePrices(coin: string, date1: string, date2: string) {
    const url: string = "http://mindeet.com/admin/operation/coinPrice/prices?coinType=" + coin + "&start=" + date1 + "&end=" + date2;
    console.log(url);
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            console.log("body");
            console.log(body);
            const result: any = JSON.parse(body);
            console.log("response");
            console.log(response);
            if (result == null || result.length < 1) {
                // todo throw exception, do not show chart. user should not see incorrect balance.
                console.error("No price from web service for:" + coin);
                resolve(-1);
            } else {
                for (const item of result) {
                    const key = coin + item.date_str;
                    coinPrices.set(key, item.price_usd);
                }
                resolve(result.length);
            }
        });
    });

}
