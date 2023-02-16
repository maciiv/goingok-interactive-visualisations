import { select } from "d3";
import { IChartPadding } from "./chartBase";
import { ChartLinearAxis, ChartSeriesAxis, ChartTimeAxis } from "./scaleBase";

export interface IChartElementsContainers {
    id: string
    width: number
    height: number
    padding: IChartPadding
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, unknown, SVGGElement, any>   
}

export class ChartElementsContainers implements IChartElementsContainers {
    id: string
    width: number
    height: number
    padding: IChartPadding
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement, unknown, SVGGElement, any>
    constructor(id: string, width: number, height: number, padding: IChartPadding, containerClass?: string) {
        this.id = id
        this.width = width
        this.height = height
        this.padding = padding
        this.svg = this.appendSVG(containerClass);
        this.contentContainer = this.appendContentContainer();
    }
    private appendSVG(containerClass?: string): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
        return select(`#${this.id} ${containerClass == undefined ? ".chart-container" : "." + containerClass}`)
            .append("svg")
            .attr("class", "chart-svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`);
    }
    private appendContentContainer(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        let result = this.svg.append("g")
            .attr("class", "content-container")
            .attr("transform", `translate(${this.padding.yAxis}, ${this.padding.top})`)
            .attr("clip-path", `url(#clip-${this.id})`);
        result.append("rect")
            .attr("class", "zoom-rect")
            .attr("width", this.width - this.padding.yAxis - this.padding.right)
            .attr("height", this.height - this.padding.xAxis - this.padding.top);
        result.append("clipPath")
            .attr("id", `clip-${this.id}`)
            .append("rect")
            .attr("x", 1)
            .attr("width", this.width - this.padding.yAxis)
            .attr("height", this.height - this.padding.xAxis - this.padding.top);
        return result;
    }
}

export interface IChartElements extends IChartElementsContainers {
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}

export class ChartElements extends ChartElementsContainers implements IChartElements {
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    constructor(id: string, width: number, height: number, padding: IChartPadding, x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis, y: ChartLinearAxis | ChartSeriesAxis, containerClass?: string) {
        super(id, width, height, padding, containerClass)
        this.xAxis = this.appendXAxis(x)
        this.appendXAxisLabel(x)
        this.yAxis = this.appendYAxis(y)
        this.appendYAxisLabel(y)
    }
    private appendXAxis(x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${this.padding.yAxis}, ${this.height - this.padding.xAxis})`)
            .attr("class", "x-axis")
            .attr("clip-path", `url(#clip-${this.id})`)
            .call(x.axis);
    };
    private appendXAxisLabel(x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (this.svg.select<SVGGElement>(".x-axis").node().getBBox().width / 2 + this.padding.yAxis) + ", " + (this.height - this.padding.xAxis + this.svg.select<SVGGElement>(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(x.label);
    };
    private appendYAxis(y: ChartLinearAxis | ChartSeriesAxis): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${this.padding.yAxis}, ${this.padding.top})`)
            .attr("class", "y-axis")
            .call(y.axis);
    };
    private appendYAxisLabel(y: ChartLinearAxis | ChartSeriesAxis): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (this.padding.yAxis - this.svg.select<SVGGElement>(".y-axis").node().getBBox().width) + ", " + (this.padding.top + this.svg.select<SVGGElement>(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(y.label);
    }
}