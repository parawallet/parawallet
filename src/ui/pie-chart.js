import * as React from "react";
import {Chart} from "react-google-charts";
import {PortfolioStore} from "../core/portfolio";
import * as moment from "moment";
import * as DB from "../db/secure-db";
import * as C from "../constants";
import {observable} from "mobx";
import {observer} from "mobx-react";
import {getPrice} from "../core/coinPrices";

@observer
export class PieChart extends React.Component {
    @observable
    portfolio = "";

    constructor(props) {
        super();
        this.portfolioStore = props.portfolioStore;
    }
    async drawChart() {
        const portfolioHistory = await this.portfolioStore.getPortfolioHistory();
        let dat = [];
        if (!portfolioHistory || portfolioHistory.length === 0) {
            portfolio = "No portfolio";
            return;
        }

        let portfolioRecord = portfolioHistory[portfolioHistory.length - 1];
        this.portfolio = getLabel(portfolioRecord.portfolio) + " = " + portfolioRecord.value.toFixed(4) + " USD";
        const portfolioMap = new Map(JSON.parse(portfolioRecord.portfolio));
        const data = [];
        data.push(["Coin", "Value (USD)"]);
        for (const coin of Array.from(portfolioMap.keys())) {
            const dateStr = moment().format(C.PORTFOLIO_DATE_FORMAT);
            const price = await getPrice(dateStr, coin);
            const value = portfolioMap.get(coin) * price;
            if (value > 0) {
                data.push([coin, value]);
            }
        }
        const options = {
            title: "Coin Percentages",
        };

        const dataTable = google.visualization.arrayToDataTable(
            data,
        );

        const chart = new google.visualization.PieChart(document.getElementById("piechart_div"));
        chart.draw(dataTable, options);
    }

    render() {
        return (
            <div style={{margin: "10px"}}>
                <h5>Portfolio Distribution</h5>
                (Current Portfolio: {this.portfolio})
                <div id="piechart_div" style={{width: "100%", height: "500px"}}></div>
            </div>
        );
    }

    componentDidMount() {
        this.drawChart().then();
    }
}

function getLabel(portfolio) {
    let label = "";
    const portfolioMap = new Map(JSON.parse(portfolio));
    for (const coin of Array.from(portfolioMap.keys())) {
        const value = portfolioMap.get(coin);
        if (value > 0) {
            label += coin + ":" + value.toFixed(2) + " ";
        }
    }
    return label;
}
