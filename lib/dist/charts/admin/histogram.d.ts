;
import { HistogramData, IAdminAnalyticsData } from "../../data/data.js";
import { ClickAdmin } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { ChartSeries, ExtendChart } from "../chartBase.js";
import { ChartElements } from "../render.js";
export declare class Histogram<T> extends ChartSeries {
    elements: HistogramChartElements<T>;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    tooltip: Tooltip;
    transitions: Transitions;
    clicking: ClickAdmin<unknown>;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    getBinData(d: IAdminAnalyticsData): HistogramData[];
    render(): void;
}
declare class HistogramChartElements<T> extends ChartElements {
    constructor(chart: Histogram<T>);
    private appendThresholdAxis;
    private appendThresholdLabel;
    private appendThresholdIndicators;
    getThresholdsValues(chart: Histogram<T>): number[];
}
export {};
