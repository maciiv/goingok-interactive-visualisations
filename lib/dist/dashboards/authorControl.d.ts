;
import { IHelp, Help } from "../charts/help.js";
import { IAuthorControlInteractions, AuthorControlInteractions } from "../charts/interactions.js";
import { IReflectionAuthor, IReflection, INodes, IAuthorAnalyticsData, IAnalytics } from "../data/data.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
import { IAuthorAnalyticsDataRaw } from "../data/db.js";
import { Reflections } from "../charts/author/reflections.js";
export declare class Dashboard {
    timeline: TimelineNetwork;
    network: Network;
    reflections: Reflections;
    constructor(data: IAuthorAnalyticsData);
}
export interface IAuthorControlCharts {
    help: IHelp;
    interactions: IAuthorControlInteractions;
    allNodes: INodes[];
    allEntries: IReflection[];
    resizeTimeline(): void;
    preloadTags(entries: IAnalytics[], enable?: boolean): INodes[];
    processSimulation(chart: Network, data: IAnalytics): void;
    processTimelineSimulation(chart: TimelineNetwork, centerX: number, centerY: number, nodes: INodes[]): void;
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[];
    renderTimeline(chart: TimelineNetwork, data: IReflection[], analytics: IAnalytics): TimelineNetwork;
    renderNetwork(chart: Network, data: IAnalytics, reflection?: IReflection): Network;
    renderReflections(data: IReflectionAuthor[]): void;
}
export declare class AuthorControlCharts implements IAuthorControlCharts {
    help: Help;
    interactions: AuthorControlInteractions;
    allNodes: INodes[];
    allEntries: IReflection[];
    resizeTimeline(): void;
    preloadTags(analytics: IAnalytics[], enable?: boolean): INodes[];
    processSimulation(chart: Network, data: IAnalytics): d3.Simulation<INodes, undefined>;
    processTimelineSimulation(chart: TimelineNetwork, centerX: number, centerY: number, nodes: INodes[]): void;
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[];
    renderTimeline(chart: TimelineNetwork, data: IReflection[], analytics: IAnalytics): TimelineNetwork;
    renderNetwork(chart: Network, data: IAnalytics, reflection?: IReflection): Network;
    renderReflections(data: IReflection[]): void;
    processReflectionsText(data: IReflection): string;
}
export declare function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsDataRaw): Promise<void>;
