import { IChartPadding } from "./chartBase";
import { ChartLinearAxis, ChartSeriesAxis, ChartTimeAxis } from "./scaleBase";
export interface IChartElementsContainers {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, unknown, SVGGElement, any>;
}
export declare class ChartElementsContainers implements IChartElementsContainers {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement, unknown, SVGGElement, any>;
    constructor(id: string, width: number, height: number, padding: IChartPadding, containerClass?: string);
    private appendSVG;
    private appendContentContainer;
}
export interface IChartElements extends IChartElementsContainers {
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
export declare class ChartElements extends ChartElementsContainers implements IChartElements {
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    constructor(id: string, width: number, height: number, padding: IChartPadding, x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis, y: ChartLinearAxis | ChartSeriesAxis, containerClass?: string);
    private appendXAxis;
    private appendXAxisLabel;
    private appendYAxis;
    private appendYAxisLabel;
}
