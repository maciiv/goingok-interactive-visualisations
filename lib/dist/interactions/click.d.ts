import { IReflectionAuthor, IAdminAnalyticsDataStats, IAdminAnalyticsData, IHistogramData } from "../data/data.js";
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
export interface IClickAdmin extends IClick {
    appendScatterText(chart: IChart, d: IReflectionAuthor, title: string, values: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthor): string;
    appendGroupsText(chart: ChartSeries, data: IAdminAnalyticsDataStats[], clickData: IAdminAnalyticsDataStats): void;
    appendThresholdPercentages(chart: Histogram, data: IAdminAnalyticsData[], clickData: IHistogramData): void;
}
export declare class ClickAdmin extends Click implements IClickAdmin {
    appendScatterText(chart: ChartTime, d: IReflectionAuthor, title: string, values?: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthor): string;
    appendGroupsText(chart: ChartSeries, data: IAdminAnalyticsDataStats[], clickData: IAdminAnalyticsDataStats): void;
    appendThresholdPercentages(chart: Histogram, data: IAdminAnalyticsData[], clickData: IHistogramData): void;
    private comparativeText;
}
export interface IClickAuthor extends IClick {
}
