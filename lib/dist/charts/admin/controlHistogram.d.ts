//;
import { HistogramData, IAdminAnalyticsData, IAdminAnalyticsDataStats } from "../../data/data.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { ChartSeries } from "../chartBase.js";
import { IHistogramChartElements } from "../render.js";
export declare class HistogramChartSeries extends ChartSeries {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    data: IAdminAnalyticsData[];
    tooltip: Tooltip;
    constructor(data: IAdminAnalyticsDataStats[]);
    getBinData(d: IAdminAnalyticsData): HistogramData[];
    render(): void;
}
