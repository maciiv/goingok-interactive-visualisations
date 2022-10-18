;
import { IChart } from "../charts/chartBase.js";
export interface IZoom {
    enableZoom(zoomed: any): void;
    appendZoomBar(): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
export declare class Zoom<T extends IChart> implements IZoom {
    protected chart: T;
    constructor(chart: T);
    enableZoom(zoomed: any): void;
    appendZoomBar(): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
