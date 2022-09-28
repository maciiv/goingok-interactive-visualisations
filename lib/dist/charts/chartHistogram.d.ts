;
import { IAdminAnalyticsData } from "../data/data.js";
import { IChart, ChartSeries } from "./chartBase.js";
import { IHistogramChartElements } from "./render.js";
import { ChartLinearAxis } from "./scaleBase.js";
export interface IHistogramChartSeries extends IChart {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    bin: d3.HistogramGeneratorNumber<number, number>;
    y: ChartLinearAxis;
    setBandwidth(data: IAdminAnalyticsData[]): void;
    setBin(): void;
}
export declare class HistogramChartSeries extends ChartSeries implements IHistogramChartSeries {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    bin: d3.HistogramGeneratorNumber<number, number>;
    constructor(id: string, domain: string[]);
    setBandwidth(data: IAdminAnalyticsData[]): void;
    setBin(): void;
}
