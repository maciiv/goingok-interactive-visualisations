import { IAnalytics, IEdges, INodes } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { Zoom } from "../../interactions/zoom";
import { ChartNetwork } from "../chartBase";
import { Help } from "../../utils/help";
interface INodesGroupBy<T extends d3.SimulationNodeDatum, R extends d3.SimulationLinkDatum<T>> extends d3.SimulationNodeDatum {
    key: "refId" | "nodeCode";
    nodes: T[];
    edges: R[];
}
export declare class Network extends ChartNetwork {
    tooltip: Tooltip<this>;
    zoom: Zoom<this>;
    help: Help;
    groupByKey: string;
    clicking: ClickNetwork<this>;
    groupBySimulation: d3.Simulation<INodesGroupBy<INodes, IEdges<INodes>>, undefined>;
    simulation: d3.Simulation<INodes, undefined>;
    extend?: Function;
    networkData: INodesGroupBy<INodes, IEdges<INodes>>[];
    private _data;
    get data(): IAnalytics;
    set data(entries: IAnalytics);
    constructor(data: IAnalytics, domain: Date[]);
    render(): Promise<void>;
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[];
    openNodes(data: INodes[], applyForce?: boolean): void;
    closeNodes(applyForce?: boolean): void;
    processSimulation(data: IAnalytics): void;
    private processData;
    private filterData;
}
declare class ClickNetwork<T extends Network> extends Click<T> {
    removeClick(): void;
}
export {};
