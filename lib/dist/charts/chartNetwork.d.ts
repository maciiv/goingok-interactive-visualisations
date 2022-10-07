//;
import { INodes } from "../data/data.js";
import { IChart, IChartPadding } from "./chartBase.js";
import { IChartElements } from "./render.js";
import { ChartTimeAxis, ChartLinearAxis } from "./scaleBase.js";
export declare class ChartNetwork implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    simulation: d3.Simulation<INodes, undefined>;
    constructor(id: string, containerClass: string, domain: Date[]);
    resetZoomRange(): void;
}
