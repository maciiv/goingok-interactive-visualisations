;
import { IAuthorAnalyticsData, INodes } from "../../data/data.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Zoom } from "../../interactions/zoom.js";
import { ChartNetwork } from "../chartBase.js";
import { Help } from "../help.js";
export declare class Network extends ChartNetwork {
    tooltip: Tooltip;
    zoom: Zoom;
    help: Help;
    simulation: d3.Simulation<INodes, undefined>;
    private _data;
    get data(): IAuthorAnalyticsData;
    set data(entries: IAuthorAnalyticsData);
    constructor(data: IAuthorAnalyticsData);
    render(): void;
    resetZoomRange(): void;
    private getTooltipNodes;
    private processSimulation;
}
