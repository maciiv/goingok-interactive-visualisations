import d3 from "d3";
import { IAdminAnalyticsData, HistogramData, TimelineData } from "../data/data.js";
import { ChartSeries, ChartTime, HistogramChartSeries, ChartTimeZoom } from "../charts/charts.js";

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

export interface IAdminControlTransitions extends ITransitions {
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>): void;
    timelineDensity(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, getDensityData: Function): void;
    timelineScatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom?: boolean, invisible?: boolean): void;
}

export class AdminControlTransitions extends Transitions implements IAdminControlTransitions {
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>): void {        
        update.selectAll(".histogram-rect")
            .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
            .join(
                enter => enter,
                update => update.style("stroke", d => d.colour)
                    .style("fill", d => d.colour)
                    .call(update => update.transition()
                        .duration(750)
                        .attr("x", d => chart.bandwidth(-d.percentage))
                        .attr("y", d => chart.y.scale(d.bin.x1))
                        .attr("height", d => chart.y.scale(d.bin.x0) - chart.y.scale(d.bin.x1))
                        .attr("width", d => chart.bandwidth(d.percentage) - chart.bandwidth(-d.percentage))),
                exit => exit)
    };
    timelineDensity(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, getDensityData: Function): void {
        update.selectAll(".contour")
            .data(d => getDensityData(d))
            .join(
                enter => enter.append("path")
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())               
                    .attr("opacity", (d: d3.ContourMultiPolygon) => d.value * 25),
                update => update.attr("d", d3.geoPath())
                    .attr("opacity", (d: d3.ContourMultiPolygon) => d.value * 20),
                exit => exit.remove());
    };
    timelineScatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom = false, invisible = false): void {
        update.selectAll("circle")
            .data(d => d.value.map(c => new TimelineData(c, d.colour, d.group)))
            .join(
                enter => enter.append("circle")
                    .attr("class", invisible ? "zoom-content" : zoom ? "circle no-hover" : "circle")
                    .attr("r", zoom ? 2 : 5)
                    .attr("cx", d => chart.x.scale(d.timestamp))
                    .attr("cy", d => chart.y.scale(d.point))
                    .attr("fill", d => d.colour)
                    .attr("stroke", d => d.colour),
                update => update .attr("fill", d => d.colour)
                    .attr("stroke", d => d.colour)
                    .call(update => update.transition()
                        .duration(750)
                        .attr("cx", d => chart.x.scale(d.timestamp))
                        .attr("cy", d => chart.y.scale(d.point))),
                exit => exit.remove())
    };
}