import { IChart } from "../charts/chartBase.js";

export interface ITooltipValues {
    label: string;
    value: number | string;
}

export class TooltipValues implements ITooltipValues {
    label: string;
    value: number | string;
    constructor(label?: string, value?: number | string) {
        this.label = label == undefined ? "" : label;
        this.value = value == undefined ? 0 : value;
    }
}

export interface ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void;
    removeTooltip(chart: IChart): void
    appendTooltipContainer(chart: IChart): void;
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[]): d3.Selection<SVGRectElement, unknown, HTMLElement, any>;
    positionTooltipContainer(chart: IChart, x: number, y: number): void;
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number, colour: string): void;
}

export class Tooltip implements ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void {
        chart.elements.content.on("mouseover", onMouseover)
        chart.elements.content.on("mouseout", onMouseout);
    };
    removeTooltip(chart: IChart): void {
        chart.elements.contentContainer.selectAll(".tooltip-container").remove();
        chart.elements.contentContainer.selectAll(".tooltip-line").remove();
    };
    appendTooltipContainer(chart: IChart): void {
        chart.elements.contentContainer.append("g")
            .attr("class", "tooltip-container");
    };
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[] = null): d3.Selection<SVGRectElement, unknown, HTMLElement, any> {
        let result = chart.elements.contentContainer.select<SVGRectElement>(".tooltip-container").append("rect")
            .attr("class", "tooltip-box");
        let text = chart.elements.contentContainer.select(".tooltip-container").append("text")
            .attr("class", "tooltip-text title")
            .attr("x", 10)
            .text(title);
        let textSize = text.node().getBBox().height
        text.attr("y", textSize);
        if (values != null) {
            values.forEach((c, i) => {
                text.append("tspan")
                    .attr("class", "tooltip-text")
                    .attr("y", textSize * (i + 2))
                    .attr("x", 15)
                    .text(`${c.label}: ${c.value}`);
            });
        }
        return result.attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5);
    };
    positionTooltipContainer(chart: IChart, x: number, y: number): void {
        chart.elements.contentContainer.select(".tooltip-container")
            .attr("transform", `translate(${x}, ${y})`)
            .transition()
            .style("opacity", 1);
    };
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number, colour: string): void {
        chart.elements.contentContainer.append("line")
            .attr("class", "tooltip-line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .style("stroke", colour);
    };
}