import d3 from "d3";
import { INodes } from "../data/data.js";
import { addDays, getDOMRect } from "../utils/utils.js";
import { IChart, IChartPadding, ChartPadding } from "./chartBase.js";
import { IChartElements, ChartElements } from "./render.js";
import { ChartTimeAxis, ChartLinearAxis } from "./scaleBase.js";

// Basic class for network chart timeline
export class ChartNetwork implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    simulation: d3.Simulation<INodes, undefined>;
    constructor(id: string, containerClass: string, domain: Date[]) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .${containerClass}`)
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(30, 10, 10, 10);
        this.y = new ChartLinearAxis("", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");       
        this.x = new ChartTimeAxis("", [addDays(Math.min.apply(domain), -30), addDays(Math.max.apply(domain), 30)], [0, this.width - this.padding.yAxis - this.padding.right]);
        this.click = false;
        this.elements = new ChartElements(this, containerClass);
        this.elements.yAxis.remove();
        this.elements.xAxis.remove();
    }
    resetZoomRange(): void {
        this.x.scale.range([0, this.width - this.padding.yAxis - this.padding.right]);
        d3.zoom().transform(this.elements.contentContainer.select(".zoom-rect"), d3.zoomIdentity);
        this.x.axis.ticks((this.width - this.padding.yAxis - this.padding.right) / 75);
        this.elements.xAxis.transition().duration(750).call(this.x.axis);
    }
}