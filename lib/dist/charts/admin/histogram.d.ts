;
import { HistogramData, IAdminAnalyticsData, IAdminAnalyticsDataStats } from "../../data/data.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { ChartSeries } from "../chartBase.js";
import { IHistogramChartElements } from "../render.js";
export declare class Histogram extends ChartSeries {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    tooltip: Tooltip;
    transitions: Transitions;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsDataStats[]);
    getBinData(d: IAdminAnalyticsData): HistogramData[];
    render(): void;
}
