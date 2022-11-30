import { ChartSeriesAxis, ChartTimeAxis, ChartLinearAxis } from "./scaleBase.js";
import { IHelp, Help } from "../utils/help.js";
import { IChartElements, ChartElements } from "./render.js";
import { getDOMRect } from "../utils/utils.js";
import { ILoading, Loading } from "../utils/loading.js";

export interface IChartScales {
    x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis
    y: ChartLinearAxis | ChartSeriesAxis
}

export interface IChartBasic {
    id: string
    width: number
    height: number
    padding: IChartPadding
}

export interface IChart extends IChartScales, IChartBasic {
    elements: IChartElements
    loading: ILoading
    renderError(e: any): void
}

export interface IChartPadding {
    xAxis: number
    yAxis: number
    top: number
    right: number
}

export class ChartPadding implements IChartPadding {
    xAxis: number
    yAxis: number
    top: number
    right: number
    constructor(xAxis?: number, yAxis?: number, top?: number, right?: number) {
        this.xAxis = xAxis == undefined ? 40 : xAxis
        this.yAxis = yAxis == undefined ? 75 : yAxis
        this.top = top == undefined ? 5 : top
        this.right = right == undefined ? 0 : right
    }
}

export class ChartSeries implements IChart {
    id: string
    width: number
    height: number
    x: ChartSeriesAxis
    y: ChartLinearAxis
    elements: IChartElements
    padding: IChartPadding
    loading: ILoading
    constructor(id: string, domain: string[], isGoingOk: boolean = true, yDomain?: number[]) {
        this.id = id
        let containerDimensions = getDOMRect(`#${id} .chart-container`)
        this.width = containerDimensions.width
        this.height = containerDimensions.height
        this.padding = new ChartPadding();
        if (!isGoingOk) {
            this.padding.yAxis = 40
        }
        this.y = new ChartLinearAxis(this.id, isGoingOk ? "Reflection Point" : "", isGoingOk ? [0, 100] : yDomain, [this.height - this.padding.xAxis - this.padding.top, 0], "left", isGoingOk)
        this.x = new ChartSeriesAxis(this.id, "Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right])
        this.elements = new ChartElements(this)
        this.loading = new Loading(this)
    }
    renderError(e: any) {
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}

export class ChartTime implements IChart {
    id: string
    width: number
    height: number
    x: ChartTimeAxis
    y: ChartLinearAxis
    elements: IChartElements
    help: IHelp
    padding: IChartPadding
    loading: ILoading
    constructor(id: string, domain: Date[], chartPadding?: ChartPadding) {
        this.id = id
        let containerDimensions = getDOMRect(`#${id} .chart-container`)
        this.width = containerDimensions.width
        this.height = containerDimensions.height
        this.padding = chartPadding !== undefined ? chartPadding : new ChartPadding(75, 75, 5)
        this.help = new Help()
        this.y = new ChartLinearAxis(this.id, "Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left")
        this.x = new ChartTimeAxis(this.id, "Time", domain, [0, this.width - this.padding.yAxis])
        this.elements = new ChartElements(this)
        this.loading = new Loading(this)
    }
    renderError(e: any) {
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}

export class ChartNetwork implements IChart {
    id: string
    width: number
    height: number
    x: ChartTimeAxis
    y: ChartLinearAxis
    padding: IChartPadding
    elements: IChartElements
    loading: ILoading
    constructor(id: string, containerClass: string, domain: Date[]) {
        this.id = id
        let containerDimensions = getDOMRect(`#${id} .${containerClass}`)
        this.width = containerDimensions.width
        this.height = containerDimensions.height
        this.padding = new ChartPadding(30, 10, 10, 10)
        this.y = new ChartLinearAxis(this.id, "", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left")       
        this.x = new ChartTimeAxis(this.id, "", domain, [0, this.width - this.padding.yAxis - this.padding.right])
        this.elements = new ChartElements(this, containerClass);
        this.elements.yAxis.remove()
        this.elements.xAxis.remove()
        this.loading = new Loading(this)
    }
    renderError(e: any) {
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}