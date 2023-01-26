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
    helpPopover(id: string, content: string): void;
    removeHelp(chart: IChart): void;
}
export declare class ChartHelp implements IChartHelp {
    id: string;
    button: HTMLButtonElement;
    constructor(id: string);
    helpPopover(id: string, content: string): void;
    removeHelp(chart: IChart): void;
    createPopover(id: string, button: HTMLButtonElement | null): HTMLDivElement;
    createArrow(): HTMLDivElement;
    createPopoverBody(content: string): HTMLDivElement;
}
export declare class ChartSeries implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartSeriesAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    loading: ILoading;
    help: IChartHelp;
    constructor(id: string, domain: string[], isGoingOk?: boolean, yDomain?: number[]);
    renderError(e: any): void;
}
export declare class ChartTime implements IChart {
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
export declare class ChartNetwork implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    padding: IChartPadding;
    elements: IChartElements;
    loading: ILoading;
    help: IChartHelp;
    constructor(id: string, containerClass: string, domain: Date[]);
    renderError(e: any): void;
}
