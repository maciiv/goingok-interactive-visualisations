import { IChart } from "../charts/chartBase.js";
export interface ITooltipValues {
    label: string;
    value: number | string;
}
export declare class TooltipValues implements ITooltipValues {
    label: string;
    value: number | string;
    constructor(label?: string, value?: number | string);
}
export interface ITooltip {
    enableTooltip(onMouseover: any, onMouseout: any): void;
    removeTooltip(): void;
    appendTooltipContainer(): void;
    appendTooltipText(title: string, values: ITooltipValues[]): d3.Selection<SVGRectElement, unknown, HTMLElement, any>;
    positionTooltipContainer(x: number, y: number): void;
    appendLine(x1: number, y1: number, x2: number, y2: number, colour: string): void;
}
export declare class Tooltip<T extends IChart> implements ITooltip {
    protected chart: T;
    constructor(chart: T);
    enableTooltip(onMouseover: any, onMouseout: any): void;
    removeTooltip(): void;
    appendTooltipContainer(): void;
    appendTooltipText(title: string, values?: ITooltipValues[]): d3.Selection<SVGRectElement, unknown, HTMLElement, any>;
    positionTooltipContainer(x: number, y: number): void;
    appendLine(x1: number, y1: number, x2: number, y2: number, colour: string): void;
}
