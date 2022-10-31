import { IChart } from "../charts/chartBase.js";

type TooltipFunction = {
    (this: SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, event: MouseEvent, d: unknown): void
}

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
    enableTooltip(onMouseover: TooltipFunction, onMouseout: TooltipFunction): void;
    removeTooltip(): void
    appendTooltipContainer(): void;
    appendTooltipText(title: string, values: ITooltipValues[]): d3.Selection<SVGRectElement, unknown, HTMLElement, any>;
    positionTooltipContainer(x: number, y: number): void;
    appendLine(x1: number, y1: number, x2: number, y2: number, colour: string): void;
}

export class Tooltip<T extends IChart> implements ITooltip {
    protected chart: T
    constructor(chart: T) {
        this.chart = chart
    }
    enableTooltip(onMouseover: TooltipFunction, onMouseout: TooltipFunction): void {
        this.chart.elements.content.on("mouseover", onMouseover)
        this.chart.elements.content.on("mouseout", onMouseout);
    };
    removeTooltip(): void {
        this.chart.elements.contentContainer.selectAll(".tooltip-container").remove();
        this.chart.elements.contentContainer.selectAll(".tooltip-line").remove();
    };
    appendTooltipContainer(): void {
        this.chart.elements.contentContainer.append("g")
            .attr("class", "tooltip-container");
    };
    appendTooltipText(title: string, values: ITooltipValues[] = null): d3.Selection<SVGRectElement, unknown, HTMLElement, any> {
        let result = this.chart.elements.contentContainer.select<SVGRectElement>(".tooltip-container").append("rect")
            .attr("class", "tooltip-box")
            .attr("rx", 5)
            .attr("ry", 5)
        let text = this.chart.elements.contentContainer.select(".tooltip-container").append("text")
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
    positionTooltipContainer(x: number, y: number): void {
        this.chart.elements.contentContainer.select(".tooltip-container")
            .attr("transform", `translate(${x}, ${y})`)
            .transition()
            .style("opacity", 1);
    };
    appendLine(x1: number, y1: number, x2: number, y2: number, colour: string): void {
        this.chart.elements.contentContainer.append("line")
            .attr("class", "tooltip-line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .style("stroke", colour);
    };
}