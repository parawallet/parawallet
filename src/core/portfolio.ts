import SecoKeyval from "seco-keyval";
import {Wallet} from "./wallet";
import * as C from "../constants";
import {getPrice, cacheThePrices} from "./coinPrices";
import * as moment from "moment";
import {Moment} from "moment";
import * as DB from "../db/secure-db";

class PortfolioRecord {
    public readonly dateStr: string;
    public portfolio: string;
    public value: number = 0;

    constructor(dateStr: string) {
        this.dateStr = dateStr;
    }
}

export class PortfolioStore {

    private keyValueStore: SecoKeyval;
    private wallets: Wallet[];

    constructor(kv: SecoKeyval, wallets: Wallet[]) {
        if (!kv) {
            throw new Error("KV is required");
        }
        if (!kv.hasOpened) {
            throw new Error("KV is not ready yet!");
        }
        this.keyValueStore = kv;
        this.wallets = wallets;
    }

    public async getPortfolioHistory() {
        const portfolioRecordList: PortfolioRecord[] = await this.keyValueStore.get(C.PORTFOLIO_HISTORY);
        if (!portfolioRecordList) {
            throw new Error("Portfolio record list is not initialized!");
        }
        return portfolioRecordList;
    }

    public async updateLastRecord() {
        const portfolioRecordList: PortfolioRecord[] = await this.keyValueStore.get(C.PORTFOLIO_HISTORY);
        if (!portfolioRecordList) {
            throw new Error("Portfolio record list is not initialized!");
        }
        const dateStr: string = moment().format(C.DATE_FORMAT);
        const portfolioRecord: PortfolioRecord = new PortfolioRecord(dateStr);
        let totalValue: number = 0;
        const currentPortfolioMap: Map<string, number> = new Map();
        for (const wallet of this.wallets) {
            const balance: number = await wallet.totalBalanceAmount();
            const price: number = await getPrice(dateStr, wallet.code);
            const value: number = balance * price;
            totalValue += value;
            currentPortfolioMap.set(wallet.code, balance);
        }
        portfolioRecord.value = totalValue;
        portfolioRecord.portfolio = JSON.stringify(Array.from(currentPortfolioMap.entries()));
        const length = portfolioRecordList.length;
        if (length > 0) {
            portfolioRecordList[length - 1] = portfolioRecord;
        } else if (length === 0) {
            portfolioRecordList.push(portfolioRecord);
        }
        await this.keyValueStore.set(C.PORTFOLIO_HISTORY, portfolioRecordList);
    }

    // todo the below parses all coins. we need to keep active wallets and do calculations just for them
    public async initializeOrUpdatePortfolioHistory() {
        const portfolioRecordList: PortfolioRecord[] = await this.keyValueStore.get(C.PORTFOLIO_HISTORY);
        if (portfolioRecordList) {
            const lastRecord: PortfolioRecord = portfolioRecordList[portfolioRecordList.length - 1];
            const todayStr: string = moment().format(C.DATE_FORMAT);
            if (lastRecord.dateStr !== todayStr) {
                for (const wallet of this.wallets) {
                    await cacheThePrices(wallet.code, lastRecord.dateStr, todayStr);
                }
                let cursorDate: Moment = moment(lastRecord.dateStr);
                const todayDate: Moment = moment().startOf("day");
                const portfolioMap: Map<string, number> = new Map(JSON.parse(lastRecord.portfolio));
                while (cursorDate < todayDate) {
                    cursorDate = moment(cursorDate).add(1, "days");
                    const portfolioRecord: PortfolioRecord = new PortfolioRecord(cursorDate.format(C.DATE_FORMAT));
                    portfolioRecord.portfolio = lastRecord.portfolio;
                    let totalValue: number = 0;
                    for (const coin of Array.from(portfolioMap.keys())) {
                        const price = await getPrice(moment(cursorDate).format(C.DATE_FORMAT), coin);
                        const amount = portfolioMap.get(coin);
                        if (amount) {
                            totalValue += price * amount;
                        }
                    }
                    portfolioRecord.value = totalValue;
                    portfolioRecordList.push(portfolioRecord);
                }
                await this.keyValueStore.set(C.PORTFOLIO_HISTORY, portfolioRecordList);
                return portfolioRecordList;
            }
        } else {
            const promises: Array<Promise<any>> = [];
            const newPortfolioRecordList: PortfolioRecord[] = [];
            // const temp = moment().subtract(5, "days");
            // const dateStr: string = temp.format(C.DATE_FORMAT);
            const dateStr: string = moment().format(C.DATE_FORMAT);
            const portfolioRecord: PortfolioRecord = new PortfolioRecord(dateStr);
            let totalValue: number = 0;
            const currentPortfolioMap: Map<string, number> = new Map();
            for (const wallet of this.wallets) {
                const balance: number = await wallet.totalBalanceAmount();
                const price: number = await getPrice(dateStr, wallet.code);
                const value: number = balance * price;
                totalValue += value;
                currentPortfolioMap.set(wallet.code, balance);
            }
            portfolioRecord.value = totalValue;
            portfolioRecord.portfolio = JSON.stringify(Array.from(currentPortfolioMap.entries()));
            newPortfolioRecordList.push(portfolioRecord);
            await this.keyValueStore.set(C.PORTFOLIO_HISTORY, newPortfolioRecordList);
            return newPortfolioRecordList;
        }
    }
}
