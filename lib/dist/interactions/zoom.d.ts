;
import { ChartNetwork, ChartTime } from "../charts/chartBase.js";
export interface IZoom {
    enableZoom(chart: ChartTime, zoomed: any): void;
    appendZoomBar(chart: ChartTime): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
export declare class Zoom implements IZoom {
    enableZoom(chart: ChartTime | ChartNetwork, zoomed: any): void;
    appendZoomBar(chart: ChartTime): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
