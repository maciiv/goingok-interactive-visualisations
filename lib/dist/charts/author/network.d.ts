;
import { IAnalytics, INodes } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Zoom } from "../../interactions/zoom.js";
import { ChartNetwork, ExtendChart } from "../chartBase.js";
import { Help } from "../help.js";
export declare class Network<T> extends ChartNetwork {
    tooltip: Tooltip;
    zoom: Zoom;
    help: Help;
    clicking: Click;
    simulation: d3.Simulation<INodes, undefined>;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IAnalytics;
    set data(entries: IAnalytics);
    constructor(data: IAnalytics, domain: Date[]);
    render(): void;
    resetZoomRange(): void;
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[];
    private processSimulation;
    private filterData;
}
