//;
import { IAdminAnalyticsData } from "../data/data.js";
import { ChartSeries, ChartTime, HistogramChartSeries, ChartTimeZoom } from "./charts.js";
export interface ITransitions {
    axisSeries(chart: ChartSeries, data: IAdminAnalyticsData[]): void;
    axisTime(chart: ChartTime, data: IAdminAnalyticsData[]): void;
    axisLinear(chart: ChartSeries): void;
}
export declare class Transitions {
    axisSeries(chart: ChartSeries, data: IAdminAnalyticsData[]): void;
    axisTime(chart: ChartTime, data: IAdminAnalyticsData[]): void;
    axisLinear(chart: ChartSeries): void;
}
export interface IAdminControlTransitions extends ITransitions {
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>): void;
    timelineDensity(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, getDensityData: Function): void;
    timelineScatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom?: boolean, invisible?: boolean): void;
}
export declare class AdminControlTransitions extends Transitions implements IAdminControlTransitions {
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>): void;
    timelineDensity(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, getDensityData: Function): void;
    timelineScatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom?: boolean, invisible?: boolean): void;
}
