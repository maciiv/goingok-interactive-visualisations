import { ChartSeriesAxis, ChartTimeAxis, ChartLinearAxis } from "./scaleBase";
import { IChartElements } from "./render";
import { ILoading } from "../utils/loading";
export interface IChartScales {
    x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis;
    y: ChartLinearAxis | ChartSeriesAxis;
}
export interface IChartBasic {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
}
export declare class ChartBasic {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
    constructor(id: string, containerClass?: string, padding?: IChartPadding);
}
export interface IChart extends IChartScales, IChartBasic {
    help: IChartHelp;
    elements: IChartElements;
    loading: ILoading;
    renderError(e: any): void;
}
export interface IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
}
export declare class ChartPadding implements IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
    constructor(xAxis?: number, yAxis?: number, top?: number, right?: number);
}
export interface IChartHelp {
    id: string;
    button: HTMLButtonElement;
    icon: HTMLElement;
    popover: HTMLDivElement | undefined;
    isOpen: boolean;
    helpPopover(content: string): void;
    removeHelp(): void;
}
export declare class ChartHelp implements IChartHelp {
    id: string;
    button: HTMLButtonElement;
    icon: HTMLElement;
    popover: HTMLDivElement | undefined;
    isOpen: boolean;
    constructor(id: string);
    helpPopover(content: string): void;
    removeHelp(): void;
    createPopover(content: string): HTMLDivElement;
    createArrow(): HTMLDivElement;
    createPopoverBody(content: string): HTMLDivElement;
    toogleIcon(): void;
}
export declare class ChartSeries extends ChartBasic implements IChart {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
    x: ChartSeriesAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    loading: ILoading;
    help: IChartHelp;
    constructor(id: string, domain: string[], isGoingOk?: boolean, yDomain?: number[]);
    renderError(e: any): void;
}
export declare class ChartTime extends ChartBasic implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    loading: ILoading;
    help: IChartHelp;
    constructor(id: string, domain: Date[], chartPadding?: ChartPadding);
    renderError(e: any): void;
}
export declare class ChartNetwork extends ChartBasic implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    padding: IChartPadding;
    elements: IChartElements;
    help: IHelp;
    loading: ILoading;
    help: IChartHelp;
    constructor(id: string, containerClass: string, domain: Date[]);
    renderError(e: any): void;
}
