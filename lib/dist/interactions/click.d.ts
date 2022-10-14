import { IReflectionAuthor, IAdminAnalyticsData, IHistogramData } from "../data/data.js";
import { IChart, ChartTime, ChartSeries } from "../charts/chartBase.js";
import { ITooltipValues } from "./tooltip.js";
import { Histogram } from "../charts/admin/histogram.js";
export interface IClick {
    enableClick(chart: IChart, onClick: any): void;
    removeClick(chart: IChart): void;
}
export declare class Click implements IClick {
    enableClick(chart: IChart, onClick: any): void;
    removeClick(chart: IChart): void;
}
export interface IClickAdmin<T> extends IClick {
    appendScatterText(chart: IChart, d: IReflectionAuthor, title: string, values: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthor): string;
    appendGroupsText(chart: ChartSeries, data: IAdminAnalyticsData[], clickData: IAdminAnalyticsData): void;
    appendThresholdPercentages(chart: Histogram<T>, data: IAdminAnalyticsData[], clickData: IHistogramData): void;
}
export declare class ClickAdmin<T> extends Click implements IClickAdmin<T> {
    appendScatterText(chart: ChartTime, d: IReflectionAuthor, title: string, values?: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthor): string;
    appendGroupsText(chart: ChartSeries, data: IAdminAnalyticsData[], clickData: IAdminAnalyticsData): void;
    appendThresholdPercentages(chart: Histogram<T>, data: IAdminAnalyticsData[], clickData: IHistogramData): void;
    private comparativeText;
}
