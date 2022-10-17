import d3 from "d3";
import { IChart, IChartBasic } from "./chartBase.js";

export interface IChartElementsContainers {
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, unknown, SVGGElement, any>   
}

export class ChartElementsContainers<T extends IChartBasic> implements IChartElementsContainers {
    protected chart: T
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement, unknown, SVGGElement, any>
    constructor(chart: T, containerClass?: string) {
        this.chart = chart
        this.svg = this.appendSVG(containerClass);
        this.contentContainer = this.appendContentContainer();
    }
    private appendSVG(containerClass?: string): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
        return d3.select(`#${this.chart.id} ${containerClass == undefined ? ".chart-container" : "." + containerClass}`)
            .append("svg")
            .attr("class", "chart-svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${this.chart.width} ${this.chart.height}`);
    }
    private appendContentContainer(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        let result = this.svg.append("g")
            .attr("class", "content-container")
            .attr("transform", `translate(${this.chart.padding.yAxis}, ${this.chart.padding.top})`)
            .attr("clip-path", `url(#clip-${this.chart.id})`);
        result.append("rect")
            .attr("class", "zoom-rect")
            .attr("width", this.chart.width - this.chart.padding.yAxis - this.chart.padding.right)
            .attr("height", this.chart.height - this.chart.padding.xAxis - this.chart.padding.top);
        result.append("clipPath")
            .attr("id", `clip-${this.chart.id}`)
            .append("rect")
            .attr("x", 1)
            .attr("width", this.chart.width - this.chart.padding.yAxis)
            .attr("height", this.chart.height - this.chart.padding.xAxis - this.chart.padding.top);
        return result;
    }
}

export interface IChartElements extends IChartElementsContainers {
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}

export class ChartElements<T extends IChart> extends ChartElementsContainers<T> implements IChartElements {
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    constructor(chart: T, containerClass?: string) {
        super(chart, containerClass)
        this.xAxis = this.appendXAxis();
        this.appendXAxisLabel();
        this.yAxis = this.appendYAxis();
        this.appendYAxisLabel();
    }
    private appendXAxis(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${this.chart.padding.yAxis}, ${this.chart.height - this.chart.padding.xAxis})`)
            .attr("class", "x-axis")
            .attr("clip-path", `url(#clip-${this.chart.id})`)
            .call(this.chart.x.axis);
    };
    private appendXAxisLabel(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (this.svg.select<SVGGElement>(".x-axis").node().getBBox().width / 2 + this.chart.padding.yAxis) + ", " + (this.chart.height - this.chart.padding.xAxis + this.svg.select<SVGGElement>(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(this.chart.x.label);
    };
    private appendYAxis(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${this.chart.padding.yAxis}, ${this.chart.padding.top})`)
            .attr("class", "y-axis")
            .call(this.chart.y.axis);
    };
    private appendYAxisLabel(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (this.chart.padding.yAxis - this.svg.select<SVGGElement>(".y-axis").node().getBBox().width) + ", " + (this.chart.padding.top + this.svg.select<SVGGElement>(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(this.chart.y.label);
    }
}