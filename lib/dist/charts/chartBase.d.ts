import { ChartSeriesAxis, ChartTimeAxis, ChartLinearAxis } from "./scaleBase.js";
import { IHelp } from "./help.js";
import { IChartElements } from "./render.js";
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
export declare type ExtendChart<T> = {
    (dashboard: T): void;
};
export interface IChart extends IChartScales, IChartBasic {
    elements: IChartElements;
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
export declare class ChartSeries implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartSeriesAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: string[], isGoingOk?: boolean, yDomain?: number[]);
}
export declare class ChartTime implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    help: IHelp;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: Date[], chartPadding?: ChartPadding);
}
export declare class UserChart implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartLinearAxis;
    y: ChartSeriesAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, containerClass: string);
}
