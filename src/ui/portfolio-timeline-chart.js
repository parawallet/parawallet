import * as React from "react";
import {Chart} from "react-google-charts";
import {PortfolioStore} from "../core/portfolio";
import * as moment from "moment";
import * as C from "../constants";
import {observable} from "mobx";
import {observer} from "mobx-react";

@observer
export class TimelineChart extends React.Component {
    @observable
    portfolio = "";

    constructor(props) {
        super();
        this.portfolioStore = props.portfolioStore;
    }
    async drawChart() {
        const portfolioHistory = await this.portfolioStore.portfolioHistory;
        let dat = [];
        for (let i = 0; i < portfolioHistory.length; i++) {
            let portfolioRecord = portfolioHistory[i];
            let elements = [];
            elements.push(moment(portfolioRecord.dateStr).toDate());
            elements.push(portfolioRecord.value);
            if (i > 0) {
                let prev = portfolioHistory[i - 1];
                if (prev.portfolio !== portfolioRecord.portfolio) {
                    elements.push("Change:");
                    elements.push(getLabel(portfolioRecord.portfolio));
                } else if (i === portfolioHistory.length - 1) {
                    elements.push("Today:");
                    elements.push(getLabel(portfolioRecord.portfolio));
                    this.portfolio = getLabel(portfolioRecord.portfolio) + " = " + portfolioRecord.value.toFixed(4) + " USD";
                } else {
                    elements.push(undefined);
                    elements.push(undefined);
                }
            } else {
                elements.push("Start:");
                elements.push(getLabel(portfolioRecord.portfolio));
            }
            dat.push(elements);
        }
        let data = new google.visualization.DataTable();
        data.addColumn("date", "Date");
        data.addColumn("number", "Portfolio Value (USD)");
        data.addColumn("string", "Title");
        data.addColumn("string", "Portfolio");
        data.addRows(dat);
        const chart = new google.visualization.AnnotationChart(document.getElementById("chart_div"));
        const options = {
            allValuesSuffix: "USD",
            displayAnnotations: true,
        };
        chart.draw(data, options);
    }

    render() {
        return (
            <div style={{margin: "10px"}}>
                <h5>Portfolio History</h5>
                (Current Portfolio: {this.portfolio})
                <div id="chart_div" style={{width: "100%", height: "500px"}}></div>
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
