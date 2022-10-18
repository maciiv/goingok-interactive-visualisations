;
import { HistogramData, IAdminAnalyticsData, IHistogramData } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { ChartSeries, ExtendChart } from "../chartBase.js";
import { ChartElements } from "../render.js";
export declare class Histogram<T> extends ChartSeries {
    elements: HistogramChartElements<this>;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    tooltip: Tooltip<this>;
    clicking: ClickHistogram<this>;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    getBinData(d: IAdminAnalyticsData): HistogramData[];
    render(): void;
}
declare class HistogramChartElements<T extends Histogram<any>> extends ChartElements<T> {
    constructor(chart: T);
    private appendThresholdAxis;
    private appendThresholdLabel;
    private appendThresholdIndicators;
    getThresholdsValues(): number[];
}
declare class ClickHistogram<T extends Histogram<any>> extends Click<T> {
    clickedBin: string;
    appendThresholdPercentages(data: IAdminAnalyticsData[], clickData: IHistogramData): void;
}
export {};
