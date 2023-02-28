import { AdminAnalyticsData, IAdminAnalyticsData, IReflectionAuthor } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { ChartSeries, IChartPadding } from "../chartBase";
import { ChartElements } from "../render";
import { ChartLinearAxis, ChartSeriesAxis } from "../scaleBase";
export declare class Histogram extends ChartSeries {
    elements: HistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    tooltip: Tooltip<this>;
    clicking: ClickHistogram<this>;
    extend?: Function;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    getBinData(d: IAdminAnalyticsData): HistogramData[];
    render(): void;
}
declare class HistogramChartElements extends ChartElements {
    constructor(id: string, width: number, height: number, padding: IChartPadding, x: ChartSeriesAxis, y: ChartLinearAxis, thresholdAxis: d3.Axis<d3.NumberValue>, containerClass?: string);
    private appendThresholdAxis;
    private appendThresholdLabel;
    private appendThresholdIndicators;
    getThresholdsValues(x: ChartSeriesAxis, y: ChartLinearAxis): number[];
}
declare class ClickHistogram<T extends Histogram> extends Click<T> {
    clickedBin: string;
    appendThresholdPercentages(data: IAdminAnalyticsData[], clickData: IHistogramData): void;
}
export interface IHistogramData extends IAdminAnalyticsData {
    bin: d3.Bin<number, number>;
    percentage: number;
}
export declare class HistogramData extends AdminAnalyticsData implements IHistogramData {
    bin: d3.Bin<number, number>;
    percentage: number;
    constructor(value: IReflectionAuthor[], group: string, colour: string, bin: d3.Bin<number, number>, percentage: number);
}
export {};
