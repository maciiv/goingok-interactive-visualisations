import d3 from "d3";
import { IAdminAnalyticsData } from "../data/data.js";
import { IChart, ChartSeries, ChartPadding } from "./chartBase.js";
import { IHistogramChartElements, HistogramChartElements } from "./render.js";
import { ChartLinearAxis, ChartSeriesAxis } from "./scaleBase.js";

export interface IHistogramChartSeries extends IChart {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    bin: d3.HistogramGeneratorNumber<number, number>;
    y: ChartLinearAxis;
    setBandwidth(data: IAdminAnalyticsData[]): void;
    setBin(): void;
}

export class HistogramChartSeries extends ChartSeries implements IHistogramChartSeries {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    bin: d3.HistogramGeneratorNumber<number, number>;
    constructor(id: string, domain: string[]) {
        super(id, domain);
        this.padding = new ChartPadding(40, 75, 5, 85);
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        d3.select(`#${this.id} svg`).remove();
        this.thresholdAxis = this.y.setThresholdAxis(30, 70);
        this.elements = new HistogramChartElements(this);
    }
    setBandwidth(data: IAdminAnalyticsData[]): void {
        this.bandwidth = d3.scaleLinear()
            .range([0, this.x.scale.bandwidth()])
            .domain([-100, 100]);
    };
    setBin(): void {
        this.bin = d3.bin().domain([0, 100]).thresholds([0, this.elements.getThresholdsValues(this)[0], this.elements.getThresholdsValues(this)[1]]);
    }
}