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
export class ChartBasic {
    id: string
    width: number
    height: number
    padding: IChartPadding
    constructor(id: string, containerClass: string = "chart-container", padding?: IChartPadding) {
        this.id = id
        let containerDimensions = getDOMRect(`#${id} .${containerClass}`)
        this.width = containerDimensions.width
        this.height = containerDimensions.height
        this.padding = padding !== undefined ? padding : new ChartPadding()
    }
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
    icon: HTMLElement
    popover: HTMLDivElement | undefined
    isOpen: boolean
    helpPopover(content: string): void
    removeHelp(): void
}

export class ChartHelp implements IChartHelp {
    id: string
    button: HTMLButtonElement
    icon: HTMLElement
    popover: HTMLDivElement | undefined
    isOpen = false
    constructor(id: string) {
        this.id = `${id}-help`
        this.button = document.querySelector<HTMLButtonElement>(`#${id} .card-title button`)
        this.icon = this.button.querySelector(`#${id} .card-title button i`)
    }
    helpPopover(content: string): void {
        const _this = this
        if (this.button === null) return
        this.button.addEventListener("click", function () {    
            if (!_this.isOpen) {
                _this.isOpen = true
                _this.createPopover(content)

                if (this.getBoundingClientRect().left - _this.popover.getBoundingClientRect().width > 0) {
                    _this.popover.style.left = `${this.getBoundingClientRect().left - _this.popover.getBoundingClientRect().width}px`;
                } else {
                    _this.popover.style.left = `${this.getBoundingClientRect().right}px`;
                    _this.popover.setAttribute("class", "popover fade bs-popover-right show")
                }
                _this.toogleIcon()
            } else {
                _this.removeHelp()
            }
        })
    }
    removeHelp(): void {
        this.isOpen = false
        this.popover?.remove()
        this.popover = undefined
        this.toogleIcon()
    }
    createPopover(content: string): HTMLDivElement {
        const popover = document.createElement("div")
        popover.setAttribute("id", this.id)
        popover.setAttribute("class", "popover fade bs-popover-left show")
        const top = this.button === null ? window.pageYOffset : window.pageYOffset + this.button.getBoundingClientRect().top
        popover.style.top = `${top}px`

        popover.appendChild(this.createArrow())
        popover.appendChild(this.createPopoverBody(content))
        document.querySelector("body").appendChild(popover)

        this.popover = popover
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
    toogleIcon() {
        this.icon.setAttribute("class", this.isOpen ? "fas fa-window-close" : "fas fa-question-circle")
    }
}

export class ChartSeries extends ChartBasic implements IChart {
    id: string
    width: number
    height: number
    padding: IChartPadding
    x: ChartSeriesAxis
    y: ChartLinearAxis
    elements: IChartElements
    loading: ILoading
    help: IChartHelp
    constructor(id: string, domain: string[], isGoingOk: boolean = true, yDomain?: number[]) {
        super(id)
        if (!isGoingOk) {
            this.padding.yAxis = 40
        }
        this.y = new ChartLinearAxis(this.id, isGoingOk ? "Reflection Point" : "", isGoingOk ? [0, 100] : yDomain, [this.height - this.padding.xAxis - this.padding.top, 0], "left", isGoingOk)
        this.x = new ChartSeriesAxis(this.id, "Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right])
        this.elements = new ChartElements(this.id, this.width, this.height, this.padding, this.x, this.y)
        this.loading = new Loading(this)
        this.help = new ChartHelp(this.id)
    }
    renderError(e: any) {
        console.error(e)
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}

export class ChartTime extends ChartBasic implements IChart {
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
        super(id, undefined, chartPadding)
        this.y = new ChartLinearAxis(this.id, "Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left")
        this.x = new ChartTimeAxis(this.id, "Time", domain, [0, this.width - this.padding.yAxis])
        this.elements = new ChartElements(this.id, this.width, this.height, this.padding, this.x, this.y)
        this.loading = new Loading(this)
        this.help = new ChartHelp(this.id)
    }
    renderError(e: any) {
        console.error(e)
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}

export class ChartNetwork extends ChartBasic implements IChart {
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
        super(id, containerClass, new ChartPadding(40, 75, 20, 10))
        this.y = new ChartLinearAxis(this.id, "Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left")       
        this.x = new ChartTimeAxis(this.id, "Time", domain, [0, this.width - this.padding.yAxis - this.padding.right])
        this.elements = new ChartElements(this.id, this.width, this.height, this.padding, this.x, this.y, containerClass)
        this.elements.contentContainer.append("clipPath")
            .attr("id", `clip-${this.id}-nodes`)
            .append("rect")
            .attr("height", this.height)
            .attr("width", this.width)
            .attr("y", - this.padding.top)
            .attr("x", - this.padding.yAxis)
        this.elements.contentContainer.attr("clip-path", `url(#clip-${this.id}-nodes)`)
        this.loading = new Loading(this)
        this.help = new ChartHelp(this.id)
    }
    renderError(e: any) {
        console.error(e)
        this.elements.contentContainer.text(`There was an error rendering the chart. ${e}`)
    }
}