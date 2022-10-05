import d3 from "d3";
import { IAdminAnalyticsData } from "../data/data.js";
import { ChartSeries, ChartTime } from "../charts/chartBase.js";

export interface ITransitions {
    axisSeries(chart: ChartSeries, data: IAdminAnalyticsData[]): void;
    axisTime(chart: ChartTime, data: IAdminAnalyticsData[]): void;
    axisLinear(chart: ChartSeries): void;
}

export class Transitions {
    axisSeries(chart: ChartSeries, data: IAdminAnalyticsData[]): void {
        chart.x.scale.domain(data.map(d => d.group));
        d3.select<SVGGElement, unknown>(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    axisTime(chart: ChartTime, data: IAdminAnalyticsData[]): void {
        chart.x.scale.domain([d3.min(data.map(d => d3.min(d.value.map(d => d.timestamp)))), d3.max(data.map(d => d3.max(d.value.map(d => d.timestamp))))]);
        d3.select<SVGGElement, unknown>(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    axisLinear(chart: ChartSeries): void {
        d3.select<SVGGElement, unknown>(`#${chart.id} .y-axis`).transition()
            .duration(750)
            .call(chart.y.axis);
    };
}