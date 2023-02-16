import { AdminAnalyticsData, IAdminAnalyticsData, IReflectionAuthor } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { ChartSeries } from "../chartBase";
import { ChartElements } from "../render";
export declare class Histogram extends ChartSeries {
    elements: HistogramChartElements<this>;
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
declare class HistogramChartElements<T extends Histogram> extends ChartElements<T> {
    constructor(chart: T);
    private appendThresholdAxis;
    private appendThresholdLabel;
    private appendThresholdIndicators;
    getThresholdsValues(): number[];
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
