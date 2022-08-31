import d3 from "d3";
import { IAdminAnalyticsData, HistogramData, TimelineData, ClickTextData, IAdminAnalyticsDataStats, IClickTextData, IDataStats, IHistogramData, IReflectionAuthor } from "data/data.js";
import { ChartSeries, ChartTime, HistogramChartSeries, ChartTimeZoom, IChart, ChartNetwork } from "./charts.js";

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

export interface IAdminControlInteractions extends IAdminControlTransitions {
    tooltip: ITooltip;
    zoom: IZoom;
}

export class AdminControlInteractions extends AdminControlTransitions implements IAdminControlInteractions {
    tooltip = new Tooltip();
    zoom = new Zoom();
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

export interface IZoom {
    enableZoom(chart: ChartTime, zoomed: any): void;
    appendZoomBar(chart: ChartTime): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}

export class Zoom implements IZoom {
    enableZoom(chart: ChartTime | ChartNetwork, zoomed: any): void {
        chart.elements.svg.selectAll(".zoom-rect")
            .attr("class", "zoom-rect active");

        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .on("zoom", zoomed);

        chart.elements.contentContainer.select(".zoom-rect").call(zoom);
    };
    appendZoomBar(chart: ChartTime): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return chart.elements.svg.append("g")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - 30})`);
    };
}

export interface IAdminExperimentalInteractions extends IAdminControlInteractions {
    click: IClick;
    sort: ISort;
}

export class AdminExperimentalInteractions extends AdminControlInteractions implements IAdminExperimentalInteractions {
    click = new ClickAdmin();
    sort = new Sort();
}

export interface IClick {
    enableClick(chart: IChart, onClick: any): void;
    removeClick(chart: IChart): void;
}

export interface IClickAdmin {
    appendScatterText(chart: IChart, d: IReflectionAuthor, title: string, values: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthor): string;
    appendGroupsText(chart: ChartSeries, data: IAdminAnalyticsDataStats[], clickData: IAdminAnalyticsDataStats): void;
    appendThresholdPercentages(chart: HistogramChartSeries, data: IAdminAnalyticsData[], clickData: IHistogramData): void;
}

export class Click implements IClick {
    enableClick(chart: IChart, onClick: any): void {
        chart.elements.content.on("click", onClick);
    };
    removeClick(chart: IChart): void {
        chart.click = false;
        chart.elements.contentContainer.selectAll(".click-text").remove();
        chart.elements.contentContainer.selectAll(".click-line").remove();
        chart.elements.contentContainer.selectAll(".click-container").remove();
        chart.elements.content.classed("clicked", false);
        chart.elements.content.classed("main", false);
    };
}

export class ClickAdmin extends Click implements IClickAdmin {
    appendScatterText(chart: ChartTime, d: IReflectionAuthor, title: string, values: ITooltipValues[] = null): void {
        let container = chart.elements.contentContainer.append("g")
            .datum(d)
            .attr("class", "click-container");
        let box = container.append("rect")
            .attr("class", "click-box");
        let text = container.append("text")
            .attr("class", "click-text title")
            .attr("x", 10)
            .text(title);
        let textSize = text.node().getBBox().height
        text.attr("y", textSize);
        if (values != null) {
            values.forEach((c, i) => {
                text.append("tspan")
                    .attr("class", "click-text")
                    .attr("y", textSize * (i + 2))
                    .attr("x", 15)
                    .text(`${c.label}: ${c.value}`);
            });
        }
        box.attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5)
            .attr("clip-path", `url(#clip-${chart.id})`);
        container.attr("transform", this.positionClickContainer(chart, box, text, d));
    };
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthor): string {
        let positionX = chart.x.scale(d.timestamp);
        let positionY = chart.y.scale(d.point) - box.node().getBBox().height - 10;
        if (chart.width - chart.padding.yAxis < chart.x.scale(d.timestamp) + text.node().getBBox().width) {
            positionX = chart.x.scale(d.timestamp) - box.node().getBBox().width;
        };
        if (chart.y.scale(d.point) - box.node().getBBox().height - 10 < 0) {
            positionY = positionY + box.node().getBBox().height + 20;
        };
        return `translate(${positionX}, ${positionY})`;
    };
    appendGroupsText(chart: ChartSeries, data: IAdminAnalyticsDataStats[], clickData: IAdminAnalyticsDataStats): void {
        chart.elements.content.classed("clicked", (d: IAdminAnalyticsDataStats) => d.group == clickData.group);

        chart.elements.contentContainer.selectAll<SVGGElement, unknown>(".click-container")
            .data(data)
            .join(
                enter => enter .append("g")
                    .attr("class", "click-container")
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`)
                    .call(enter => enter.selectAll("text")
                        .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
                        .enter()
                        .append("text")
                        .attr("class", "click-text black")                       
                        .attr("y", c => chart.y.scale((c.data.stat as IDataStats).value as number) - 5)
                        .text(c => `${(c.data.stat as IDataStats).displayName}: ${(c.data.stat as IDataStats).value} `)
                        .append("tspan")
                        .attr("class", c => this.comparativeText(c)[0])
                        .text(c => c.data.group != clickData.group ? `(${this.comparativeText(c)[1]})` : "")),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
                    .call(update => update.selectAll("text")
                    .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
                        .join(
                            enter => enter,
                            update => update.attr("y", c => chart.y.scale((c.data.stat as IDataStats).value as number) - 5)
                                .text(c => `${(c.data.stat as IDataStats).displayName}: ${(c.data.stat as IDataStats).value} `)
                                .append("tspan")
                                .attr("class", c => this.comparativeText(c)[0])
                                .text(c => c.data.group != clickData.group ? `(${this.comparativeText(c)[1]})` : ""),
                            exit => exit
                        )),
                exit => exit.remove()
            );
    };
    appendThresholdPercentages(chart: HistogramChartSeries, data: IAdminAnalyticsData[], clickData: IHistogramData): void {
        let thresholds = chart.elements.getThresholdsValues(chart);
        let tDistressed = thresholds[0];
        let tSoaring = thresholds[1];

        chart.elements.content.classed("clicked", (d: IHistogramData) => d.group == clickData.group && clickData.bin.length - d.bin.length == 0);

        chart.elements.contentContainer.selectAll<SVGGElement, unknown>(".click-container")
            .data(data)
            .join(
                enter => enter .append("g")
                    .attr("class", "click-container")
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`)
                    .call(enter => enter.selectAll("text")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .enter()
                        .append("text")
                        .attr("class", "click-text black")
                        .attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
                        .text(c => `${c.percentage}% ` )
                        .append("tspan")
                        .attr("class", c => this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[0])
                        .text(c => c.group != clickData.group && c.bin.x0 == clickData.bin.x0 && c.bin.x1 == clickData.bin.x1 ? `(${this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[1]})` : ""))
                        ,
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
                    .call(update => update.selectAll("text")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .join(
                            enter => enter,
                            update => update.attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
                            .text(c => `${c.percentage}% ` )
                            .append("tspan")
                            .attr("class", c => this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[0])
                            .text(c => c.group != clickData.group && c.bin.x0 == clickData.bin.x0 && c.bin.x1 == clickData.bin.x1 ? `(${this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[1]})` : ""),
                            exit => exit
                        )),
                exit => exit.remove()
            );       
    };
    private comparativeText(textData: IClickTextData): string[] {
        let textClass = "click-text";
        let textSymbol = "";
        let textValue;
        if (typeof(textData.clickData.stat) != "number" && typeof(textData.data.stat) != "number") {
            textValue = (textData.clickData.stat.value as number) - (textData.data.stat.value as number)
        } else {
            textValue = (textData.clickData.stat as number) - (textData.data.stat as number)
        }

        if (textValue < 0) {
            textClass = textClass + " positive";
            textSymbol = "+";
        }
        else if (textValue > 0) {
            textClass = textClass + " negative";
            textSymbol = "-";
        }
        else {
            textClass = textClass + " black"
        }

        if (textData.clickData.group != null && textData.data.group != null) {
            return [textClass, `${textSymbol}${textData.clickData.group == textData.data.group 
                && textValue == 0 ? typeof(textData.clickData.stat) != "number" ? textData.clickData.stat.value : textData.clickData.stat : (Math.abs(textValue))}`];
        } else {
            return [textClass, `${textSymbol}${(Math.abs(textValue))}`];
        }
    }
}

export interface ISort {
    sortData(a: number, b: number, sorted: boolean): number;
    setSorted(sorted: string, option: string): string;
}

export class Sort implements ISort {
    sortData(a: number | Date | string, b: number | Date | string, sorted: boolean): number {
        if (a < b) {
            if (sorted) {
                return -1;
            } else {
                return 1;
            }
        } if (a > b) {
            if (sorted) {
                return 1;
            } else {
                return -1;
            }
        }
        return 0;
    };
    setSorted(sorted: string, option: string): string {
        return sorted == option ? "" : option;
    }
}

export interface IAuthorControlTransitions extends ITransitions {
}

export class AuthorControlTransitions extends Transitions implements IAuthorControlTransitions {
}

export interface IAuthorControlInteractions extends IAuthorControlTransitions {
    tooltip: ITooltip;
    zoom: IZoom;
}

export class AuthorControlInteractions extends AuthorControlTransitions implements IAuthorControlInteractions {
    tooltip = new Tooltip();
    zoom = new Zoom();
}

export interface IAuthorExperimentalInteractions extends IAuthorControlInteractions {
    click: IClick;
    sort: ISort;
}

export class AuthorExperimentalInteractions extends AuthorControlInteractions implements IAuthorExperimentalInteractions {
    click = new Click();
    sort = new Sort();
}