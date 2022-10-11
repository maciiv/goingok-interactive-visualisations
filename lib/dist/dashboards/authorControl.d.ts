;
import { IHelp, Help } from "../charts/help.js";
import { IAuthorControlInteractions, AuthorControlInteractions } from "../charts/interactions.js";
import { IReflectionAuthor, IReflectionAnalytics, IReflection, INodes, IAuthorAnalyticsData } from "../data/data.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
export declare class Dashboard {
    timeline: TimelineNetwork;
    network: Network;
    constructor(data: IAuthorAnalyticsData);
}
export interface IAuthorControlCharts {
    help: IHelp;
    interactions: IAuthorControlInteractions;
    allNodes: INodes[];
    allEntries: IReflection[];
    resizeTimeline(): void;
    preloadTags(entries: IReflectionAnalytics[], enable?: boolean): INodes[];
    processSimulation(chart: Network, data: IReflectionAnalytics): void;
    processTimelineSimulation(chart: TimelineNetwork, centerX: number, centerY: number, nodes: INodes[]): void;
    getTooltipNodes(data: IReflectionAnalytics, nodeData: INodes): INodes[];
    renderTimeline(chart: TimelineNetwork, data: IReflection[], analytics: IReflectionAnalytics): TimelineNetwork;
    renderNetwork(chart: Network, data: IReflectionAnalytics, reflection?: IReflection): Network;
    renderReflections(data: IReflectionAuthor[]): void;
}
export declare class AuthorControlCharts implements IAuthorControlCharts {
    help: Help;
    interactions: AuthorControlInteractions;
    allNodes: INodes[];
    allEntries: IReflection[];
    resizeTimeline(): void;
    preloadTags(analytics: IReflectionAnalytics[], enable?: boolean): INodes[];
    processSimulation(chart: Network, data: IReflectionAnalytics): d3.Simulation<INodes, undefined>;
    processTimelineSimulation(chart: TimelineNetwork, centerX: number, centerY: number, nodes: INodes[]): void;
    getTooltipNodes(data: IReflectionAnalytics, nodeData: INodes): INodes[];
    renderTimeline(chart: TimelineNetwork, data: IReflection[], analytics: IReflectionAnalytics): TimelineNetwork;
    renderNetwork(chart: Network, data: IReflectionAnalytics, reflection?: IReflection): Network;
    renderReflections(data: IReflection[]): void;
    processReflectionsText(data: IReflection): string;
}
export declare function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsData): Promise<void>;
