import { ChartSeriesAxis, ChartTimeAxis, ChartLinearAxis } from "./scaleBase.js";
import { IHelp, Help } from "./help.js";
import { IChartElements, ChartElements } from "./render.js";
import { getDOMRect } from "../utils/utils.js";

export interface IChartScales {
    x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis;
    y: ChartLinearAxis | ChartSeriesAxis;
}

export interface IChartBasic {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
    click: boolean;
}


export type ExtendChart<T> = {
    (dashboard: T): void
}

export interface IChart extends IChartScales, IChartBasic {
    elements: IChartElements;
}

export interface IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
}

export class ChartPadding implements IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
    constructor(xAxis?: number, yAxis?: number, top?: number, right?: number) {
        this.xAxis = xAxis == undefined ? 40 : xAxis;
        this.yAxis = yAxis == undefined ? 75 : yAxis;
        this.top = top == undefined ? 5 : top;
        this.right = right == undefined ? 0 : right;
    }
}

export class ChartSeries implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartSeriesAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: string[], isGoingOk: boolean = true, yDomain?: number[]) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .chart-container`)
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding();
        if (!isGoingOk) {
            this.padding.yAxis = 40;
        }
        this.y = new ChartLinearAxis(isGoingOk ? "Reflection Point" : "", isGoingOk ? [0, 100] : yDomain, [this.height - this.padding.xAxis - this.padding.top, 0], "left", isGoingOk);
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        this.click = false;
        this.elements = new ChartElements(this);
    }
}

export class ChartTime implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    help: IHelp;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: Date[], chartPadding?: ChartPadding) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .chart-container`)
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = chartPadding !== undefined ? chartPadding : new ChartPadding(75, 75, 5);
        this.help = new Help();
        this.y = new ChartLinearAxis("Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartTimeAxis("Time", domain, [0, this.width - this.padding.yAxis]);
        this.click = false;
        this.elements = new ChartElements(this);
    }
}

export class UserChart implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartLinearAxis;
    y: ChartSeriesAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, containerClass: string) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .${containerClass}`)
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(40, 55, 10, 10);
        this.y = new ChartSeriesAxis("", ["distressed", "going ok", "soaring"], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartLinearAxis("", [0, 100], [0, this.width - this.padding.yAxis - this.padding.right], "bottom", false);
        this.x.axis.tickValues([0, 25, 50, 75, 100]);
        this.click = false;
        this.elements = new ChartElements(this, containerClass);
    }
}