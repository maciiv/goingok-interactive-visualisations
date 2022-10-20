;
import { IChart } from "../charts/chartBase.js";
declare type ZoomFunction = {
    (this: Element, event: d3.D3ZoomEvent<SVGRectElement, unknown>, d: unknown): void;
};
export interface IZoom {
    enableZoom(zoomed: any): void;
    appendZoomBar(): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
export declare class Zoom<T extends IChart> implements IZoom {
    protected chart: T;
    constructor(chart: T);
    enableZoom(zoomed: ZoomFunction): void;
    appendZoomBar(): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
export {};
