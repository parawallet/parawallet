import {Wallet} from "./wallet";
import * as C from "../constants";
import {getPrice, cacheThePrices} from "./coin-prices";
import * as moment from "moment";
import {Moment} from "moment";

export class PortfolioRecord {
    public readonly dateStr: string;
    public readonly portfolio: string;
    public readonly value: number;

    constructor(dateStr: string, portfolio: string, value: number) {
        this.dateStr = dateStr;
        this.portfolio = portfolio;
        this.value = value;
    }
}

export class PortfolioStore {
    private readonly wallets: ReadonlyArray<Wallet>;
    private readonly records: PortfolioRecord[] = [];

    constructor(wallets: ReadonlyArray<Wallet>) {
        this.wallets = wallets;
    }

    public get portfolioHistory(): ReadonlyArray<PortfolioRecord> {
        return this.records;
    }

    public async updateLastRecord() {
        const dateStr = todayDate().format(C.PORTFOLIO_DATE_FORMAT);
        console.log(`Updating last portfolio record for date: ${dateStr}`);
        let totalValue = 0;
        const currentPortfolioMap = new Map<string, number>();
        for (const wallet of this.wallets) {
            const balance = wallet.totalBalanceAmount;
            const price: number = await getPrice(dateStr, wallet.code);
            const value = balance * price;
            totalValue += value;
            currentPortfolioMap.set(wallet.code, balance);
        }
        const portfolio = JSON.stringify(Array.from(currentPortfolioMap.entries()));
        const record = new PortfolioRecord(dateStr, portfolio, totalValue);
        this.records[this.records.length - 1] = record;
        this.persistRecord(record);
    }

    // todo the below parses all coins. we need to keep active wallets and do calculations just for them
    public async initializeOrUpdatePortfolioHistory() {
        if (this.records.length > 0) {
            throw Error("Already initialized!");
        }

        if (!this.restoreAllRecords()) {
            return await this.initializePortfolioHistory();
        }

        const lastRecord = this.records[this.records.length - 1];
        const lastRecordDate = moment(lastRecord.dateStr, C.PORTFOLIO_DATE_FORMAT);
        console.log(`Last portfolio record date: ${lastRecordDate}`);
        if (lastRecordDate.isSame(todayDate())) {
            return;
        }

        await this.updatePortfolioHistory(lastRecord);
    }

    private restoreAllRecords() {
        const startDateStr = localStorage.getItem(C.PORTFOLIO_START);
        if (!startDateStr) {
            return false;
        }

        console.log(`Restoring portfolio history from ${startDateStr}`);
        const date = moment(startDateStr, C.PORTFOLIO_DATE_FORMAT);
        for (; date.isSameOrBefore(todayDate()); date.add(1, "days")) {
            const record = this.restoreRecord(date);
            if (!record) {
                break;
            }
            this.records.push(record);
        }
        return true;
    }

    private async updatePortfolioHistory(lastRecord: PortfolioRecord) {
        const fromDate = moment(lastRecord.dateStr, C.PORTFOLIO_DATE_FORMAT).add(1, "days");
        const today = todayDate();
        for (const wallet of this.wallets) {
            await cacheThePrices(wallet.code, fromDate.format(C.PORTFOLIO_DATE_FORMAT), today.format(C.PORTFOLIO_DATE_FORMAT));
        }

        const portfolioMap = new Map<string, number>(JSON.parse(lastRecord.portfolio));

        // CAUTION: moment object is mutable: https://momentjs.com/guides/#/lib-concepts/mutability/
        for (; fromDate.isSameOrBefore(today); fromDate.add(1, "days")) {
            const dateStr = fromDate.format(C.PORTFOLIO_DATE_FORMAT);
            console.log(`Updating portolio [${lastRecord.portfolio}] for date: ${dateStr}`);

            let totalValue = 0;
            for (const coin of portfolioMap.keys()) {
                const price = await getPrice(dateStr, coin);
                const amount = portfolioMap.get(coin);
                if (amount) {
                    totalValue += price * amount;
                }
            }
            const record = new PortfolioRecord(dateStr, lastRecord.portfolio, totalValue);
            this.records.push(record);
            this.persistRecord(record);
        }
    }

    private async initializePortfolioHistory() {
        const dateStr = todayDate().format(C.PORTFOLIO_DATE_FORMAT);
        console.log(`Initializing portolio for the first time. Date: ${dateStr}`);
        localStorage.setItem(C.PORTFOLIO_START, dateStr);
        await this.updateLastRecord();
    }

    private restoreRecord(date: Moment): PortfolioRecord | null {
        const recStr = localStorage.getItem(C.PORTFOLIO_PREFIX + "-" + date.format(C.PORTFOLIO_DATE_FORMAT));
        if (recStr) {
            return JSON.parse(recStr) as PortfolioRecord;
        }
        return null;
    }

    private persistRecord(record: PortfolioRecord): void {
        localStorage.setItem(C.PORTFOLIO_PREFIX + "-" + record.dateStr, JSON.stringify(record));
    }
}

function todayDate() {
    return moment().startOf("day");
}
