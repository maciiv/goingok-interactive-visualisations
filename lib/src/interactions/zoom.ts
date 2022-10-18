import d3 from "d3";
import { IChart } from "../charts/chartBase.js";

export interface IZoom {
    enableZoom(zoomed: any): void;
    appendZoomBar(): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}

export class Zoom<T extends IChart> implements IZoom {
    protected chart: T
    constructor(chart: T) {
        this.chart = chart
    }
    enableZoom(zoomed: any): void {
        this.chart.elements.svg.selectAll(".zoom-rect")
            .attr("class", "zoom-rect active");

        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[0, 0], [this.chart.width - this.chart.padding.yAxis, this.chart.height]])
            .translateExtent([[0, 0], [this.chart.width - this.chart.padding.yAxis, this.chart.height]])
            .on("zoom", zoomed);

        this.chart.elements.contentContainer.select(".zoom-rect").call(zoom);
    };
    appendZoomBar(): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.chart.elements.svg.append("g")
            .attr("id", "zoom-container")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", this.chart.width - this.chart.padding.yAxis)
            .attr("transform", `translate(${this.chart.padding.yAxis}, ${this.chart.height - 30})`);
    };
}