;
import { ChartSeries, ChartPadding } from "./chartBase.js";
import { HistogramChartElements } from "./render.js";
import { ChartSeriesAxis } from "./scaleBase.js";
export class HistogramChartSeries extends ChartSeries {
    constructor(id, domain) {
        super(id, domain);
        this.padding = new ChartPadding(40, 75, 5, 85);
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        d3.select(`#${this.id} svg`).remove();
        this.thresholdAxis = this.y.setThresholdAxis(30, 70);
        this.elements = new HistogramChartElements(this);
    }
    setBandwidth(data) {
        this.bandwidth = d3.scaleLinear()
            .range([0, this.x.scale.bandwidth()])
            .domain([-100, 100]);
    }
    ;
    setBin() {
        this.bin = d3.bin().domain([0, 100]).thresholds([0, this.elements.getThresholdsValues(this)[0], this.elements.getThresholdsValues(this)[1]]);
    }
}
