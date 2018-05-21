import {observable} from "mobx";
import {observer} from "mobx-react";
import * as moment from "moment";
import * as React from "react";
import {Chart} from "react-google-charts";
import {PortfolioStore} from "../../core/portfolio";
import * as DB from "../../util/secure-db";
import * as C from "../../constants";
import {getPrice} from "../../core/coin-prices";
import {PaneHeader} from "../pane-header";

@observer
export class PieChart extends React.Component {
    @observable
    portfolio = "";

    constructor(props) {
        super();
        this.portfolioStore = props.portfolioStore;
    }

    async drawChart() {
        const portfolioHistory = this.portfolioStore.portfolioHistory;
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
            chartArea: { left: 0, top: 60, width: "70%", height: "75%"},
            is3D: true,
            // title: "Coin Percentages",
        };

        const dataTable = google.visualization.arrayToDataTable(
            data,
        );

        const chart = new google.visualization.PieChart(document.getElementById("piechart_div"));
        chart.draw(dataTable, options);
    }

    render() {
        return (
            <div>
                <PaneHeader title={"Portfolio Percentages"} icon={"fas fa-chart-pie"} subtitle={"Current Portfolio: " + this.portfolio}/>
                <div id="piechart_div" style={{height: "500px"}}></div>
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
