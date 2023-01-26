import { ChartSeriesAxis, ChartTimeAxis, ChartLinearAxis } from "./scaleBase";
import { IChartElements, ChartElements } from "./render";
import { getDOMRect } from "../utils/utils";
import { ILoading, Loading } from "../utils/loading";

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
    help: IChartHelp
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

export interface IChartHelp {
    id: string
    button: HTMLButtonElement
    helpPopover(id: string, content: string): void
    removeHelp(chart: IChart): void
}

export class ChartHelp implements IChartHelp {
    id: string
    button: HTMLButtonElement
    constructor(id: string) {
        this.id = `${id}-help`
        this.button = document.querySelector<HTMLButtonElement>(`#${id} .card-title button`)
    }
    helpPopover(id: string, content: string): void {
        const _this = this
        const helpId = `${id}-help`
        const button = document.querySelector<HTMLButtonElement>(`#${id} .card-title button`)
        if (button === null) return;
        button.addEventListener("click", function() {    
            let icon = this.querySelector("i")
            if (document.querySelector(`#${helpId}`) === null) {
                const popover = _this.createPopover(helpId, this)
                document.querySelector("body").appendChild(popover)
                
                const arrow = _this.createArrow()
                popover.appendChild(arrow)

                const popoverBody = _this.createPopoverBody(content)
                popover.appendChild(popoverBody)

                if (this.getBoundingClientRect().left - popover.getBoundingClientRect().width > 0) {
                    popover.style.left = `${this.getBoundingClientRect().left - popover.getBoundingClientRect().width}px`;
                } else {
                    popover.style.left = `${this.getBoundingClientRect().right}px`;
                    popover.setAttribute("class", "popover fade bs-popover-right show")
                }
                
                icon?.setAttribute("class", "fas fa-window-close")
            } else {
                document.querySelector(`#${helpId}`).remove()
                icon?.setAttribute("class", "fas fa-question-circle")
            }
        })
    }
    removeHelp(chart: IChart): void {
        document.querySelector(`#${chart.id}-help`)?.remove()
        document.querySelector(`#${chart.id}-help-button`)?.remove()
        document.querySelector(`#${chart.id}-help-data`)?.remove()
        document.querySelector(`#${chart.id}-help-drag`)?.remove()
        document.querySelector(`#${chart.id}-help-zoom`)?.remove()
        let icon = document.querySelector(`#${chart.id} .card-title i`)
        icon?.setAttribute("class", "fas fa-question-circle")
    }
    createPopover(id: string, button: HTMLButtonElement | null): HTMLDivElement {
        const popover = document.createElement("div")
        popover.setAttribute("id", id)
        popover.setAttribute("class", "popover fade bs-popover-left show")
        const top = button === null ? window.pageYOffset : window.pageYOffset + button.getBoundingClientRect().top
        popover.style.top = `${top}px`
        return popover
    }
    createArrow(): HTMLDivElement {
        const arrow = document.createElement("div")
        arrow.setAttribute("class", "arrow")
        arrow.style.top = "6px"
        return arrow
    }
    createPopoverBody(content: string): HTMLDivElement {
        const popoverBody = document.createElement("div")
        popoverBody.setAttribute("class", "popover-body")
        popoverBody.innerHTML = content
        return popoverBody
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
    help: IChartHelp
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
        this.help = new ChartHelp(this.id)
    }
    renderError(e: any) {
        console.error(e)
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
    padding: IChartPadding
    loading: ILoading
    help: IChartHelp
    constructor(id: string, domain: Date[], chartPadding?: ChartPadding) {
        this.id = id
        let containerDimensions = getDOMRect(`#${id} .chart-container`)
        this.width = containerDimensions.width
        this.height = containerDimensions.height
        this.padding = chartPadding !== undefined ? chartPadding : new ChartPadding(75, 75, 5)
        this.y = new ChartLinearAxis(this.id, "Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left")
        this.x = new ChartTimeAxis(this.id, "Time", domain, [0, this.width - this.padding.yAxis])
        this.elements = new ChartElements(this)
        this.loading = new Loading(this)
        this.help = new ChartHelp(this.id)
    }
    renderError(e: any) {
        console.error(e)
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
    help: IChartHelp
    constructor(id: string, containerClass: string, domain: Date[]) {
        this.id = id
        let containerDimensions = getDOMRect(`#${id} .${containerClass}`)
        this.width = containerDimensions.width
        this.height = containerDimensions.height
        this.padding = new ChartPadding(30, 10, 10, 10)
        this.y = new ChartLinearAxis(this.id, "", [-50, 150], [this.height - this.padding.xAxis - this.padding.top, 0], "left")       
        this.x = new ChartTimeAxis(this.id, "", domain, [0, this.width - this.padding.yAxis - this.padding.right])
        this.elements = new ChartElements(this, containerClass);
        this.elements.yAxis.remove()
        this.elements.xAxis.remove()
        this.loading = new Loading(this)
        this.help = new ChartHelp(this.id)
    }
    renderError(e: any) {
        console.error(e)
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}