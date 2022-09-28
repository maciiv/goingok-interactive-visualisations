import d3 from "d3";
import { IChart } from "./chartBase.js";
import { HistogramChartSeries, IHistogramChartSeries } from "./chartHistogram.js";

export interface IChartElements {
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, unknown, SVGGElement, any>;
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}


export class ChartElements implements IChartElements {
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement, unknown, SVGGElement, any>;
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    constructor(chart: IChart, containerClass?: string) {
        this.svg = this.appendSVG(chart, containerClass);
        this.contentContainer = this.appendContentContainer(chart);
        this.xAxis = this.appendXAxis(chart);
        this.appendXAxisLabel(chart);
        this.yAxis = this.appendYAxis(chart);
        this.appendYAxisLabel(chart);
    }
    private appendSVG(chart: IChart, containerClass?: string): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
        return d3.select(`#${chart.id} ${containerClass == undefined ? ".chart-container" : "." + containerClass}`)
            .append("svg")
            .attr("class", "chart-svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${chart.width} ${chart.height}`);
    };
    private appendContentContainer(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        let result = this.svg.append("g")
            .attr("class", "content-container")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.padding.top})`)
            .attr("clip-path", `url(#clip-${chart.id})`);
        result.append("rect")
            .attr("class", "zoom-rect")
            .attr("width", chart.width - chart.padding.yAxis - chart.padding.right)
            .attr("height", chart.height - chart.padding.xAxis - chart.padding.top);
        result.append("clipPath")
            .attr("id", `clip-${chart.id}`)
            .append("rect")
            .attr("x", 1)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("height", chart.height - chart.padding.xAxis - chart.padding.top);
        return result;
    };
    private appendXAxis(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - chart.padding.xAxis})`)
            .attr("class", "x-axis")
            .attr("clip-path", `url(#clip-${chart.id})`)
            .call(chart.x.axis);
    };
    private appendXAxisLabel(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (this.svg.select<SVGGElement>(".x-axis").node().getBBox().width / 2 + chart.padding.yAxis) + ", " + (chart.height - chart.padding.xAxis + this.svg.select<SVGGElement>(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(chart.x.label);
    };
    private appendYAxis(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.padding.top})`)
            .attr("class", "y-axis")
            .call(chart.y.axis);
    };
    private appendYAxisLabel(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (chart.padding.yAxis - this.svg.select<SVGGElement>(".y-axis").node().getBBox().width) + ", " + (chart.padding.top + this.svg.select<SVGGElement>(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(chart.y.label);
    }
}

export interface IHistogramChartElements extends IChartElements {
    getThresholdsValues(chart: HistogramChartSeries): number[];
}

export class HistogramChartElements extends ChartElements implements IHistogramChartElements {
    constructor(chart: IHistogramChartSeries) {
        super(chart);
        let thresholds = this.getThresholdsValues(chart);
        this.appendThresholdAxis(chart);
        this.appendThresholdIndicators(chart, thresholds);
        this.appendThresholdLabel(chart);
    }
    private appendThresholdAxis(chart: IHistogramChartSeries): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.contentContainer.append("g")
            .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right}, 0)`)
            .attr("class", "threshold-axis")
            .call(chart.thresholdAxis);
    };
    private appendThresholdLabel(chart: IHistogramChartSeries): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        let label = this.svg.append("g")
            .attr("class", "threshold-label-container")
        label.append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text("Thresholds");
        label.attr("transform", `translate(${chart.width - chart.padding.right + this.contentContainer.select<SVGGElement>(".threshold-axis").node().getBBox().width + label.node().getBBox().height}, ${chart.padding.top + this.svg.select<SVGGElement>(".y-axis").node().getBBox().height / 2}) rotate(-90)`);
        return label;
    };
    private appendThresholdIndicators(chart: IHistogramChartSeries, thresholds: number[]): void {
        this.contentContainer.selectAll(".threshold-indicator-container")
            .data(thresholds)
            .enter()
            .append("g")
            .attr("class", "threshold-indicator-container")
            .classed("distressed", d => d < 50 ? true : false)
            .classed("soaring", d => d > 50 ? true : false)
            .attr("transform", d => `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${d < 50 ? chart.y.scale(d) + 25 : chart.y.scale(d) - 15})`)
            .call(g => g.append("rect")
                .attr("class", "threshold-indicator-box")
                .classed("distressed", d => d < 50 ? true : false)
                .classed("soaring", d => d > 50 ? true : false))
            .call(g => g.append("text")
                .attr("class", "threshold-indicator-text")
                .attr("x", 5)
                .text(d => d))
            .call(g => g.selectAll("rect")
                .attr("width", g.select<SVGTextElement>("text").node().getBBox().width + 10)
                .attr("height", g.select<SVGTextElement>("text").node().getBBox().height + 5)
                .attr("y", -g.select<SVGTextElement>("text").node().getBBox().height));
        
        this.contentContainer.selectAll(".threshold-line")
            .data(thresholds)
            .enter()
            .append("line")
            .attr("class", "threshold-line")
            .classed("distressed", d => d < 50 ? true : false)
            .classed("soaring", d => d > 50 ? true : false)
            .attr("x1", 0)
            .attr("x2", chart.width - chart.padding.yAxis - chart.padding.right)
            .attr("y1", d => chart.y.scale(d))
            .attr("y2", d => chart.y.scale(d));
    }
    getThresholdsValues(chart: IHistogramChartSeries): number[] {
        let result: number[] = [30, 70];
        let dThreshold = this.contentContainer.select<SVGLineElement>(".threshold-line.distressed");
        if (!dThreshold.empty()) {
            result[0] = chart.y.scale.invert(parseInt(dThreshold.attr("y1")));
        }
        let sThreshold = this.contentContainer.select<SVGLineElement>(".threshold-line.soaring");
        if (!sThreshold.empty()) {
            result[1] = chart.y.scale.invert(parseInt(sThreshold.attr("y1")));
        }
        return result;
    };
}