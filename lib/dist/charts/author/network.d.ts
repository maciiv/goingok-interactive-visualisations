import { GroupByType, IAnalytics, IAuthorAnalytics, INodes } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { Zoom } from "../../interactions/zoom";
import { ChartNetwork } from "../chartBase";
import { Help } from "../../utils/help";
export declare class Network extends ChartNetwork {
    tooltip: Tooltip<this>;
    zoom: ZoomNetwork<this>;
    help: Help;
    groupByKey: GroupByType;
    clicking: ClickNetwork<this>;
    groupBySimulation: d3.Simulation<INodes, undefined>;
    simulation: d3.Simulation<INodes, undefined>;
    extend?: Function;
    private _data;
    get data(): IAnalytics;
    set data(entries: IAnalytics);
    constructor(data: IAuthorAnalytics, domain: Date[]);
    render(): Promise<void>;
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[];
    openNodes(data: INodes[], applyForce?: boolean): void;
    closeNodes(applyForce?: boolean): void;
    private processSimulation;
    private setYForce;
    private setXForce;
    private filterData;
    private fixGroupNodes;
    private rScale;
    private renderLines;
    private getLines;
}
declare class ClickNetwork<T extends Network> extends Click<T> {
    removeClick(): void;
}
declare class ZoomNetwork<T extends Network> extends Zoom<T> {
    protected handleZoomMinus(): void;
    protected handleZoomPlus(): void;
}
export {};
