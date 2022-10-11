import { IAuthorExperimentalInteractions, AuthorExperimentalInteractions } from "../charts/interactions.js";
import { IReflectionAnalytics, IReflection, INodes, IAuthorAnalyticsData } from "../data/data.js";
import { AuthorControlCharts, IAuthorControlCharts } from "./authorControl.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
export interface IAuthorExperimentalCharts extends IAuthorControlCharts {
    interactions: IAuthorExperimentalInteractions;
    allAnalytics: IReflectionAnalytics[];
    timelineChart: TimelineNetwork;
    networkChart: Network;
    sorted: string;
    handleTags(): void;
    handleTagsColours(): void;
    handleReflectionsSort(): void;
}
export declare class AuthorExperimentalCharts extends AuthorControlCharts implements IAuthorExperimentalCharts {
    interactions: AuthorExperimentalInteractions;
    allAnalytics: IReflectionAnalytics[];
    timelineChart: TimelineNetwork;
    networkChart: Network;
    sorted: string;
    preloadTags(entries: IReflectionAnalytics[], enable?: boolean): INodes[];
    handleTags(): void;
    handleTagsColours(): void;
    handleReflectionsSort(): void;
    handleFilterButton(): void;
    private getUpdatedAnalyticsData;
    private getUpdatedNetworkData;
    renderTimeline(chart: TimelineNetwork, data: IReflection[], analytics: IReflectionAnalytics): TimelineNetwork;
    renderNetwork(chart: Network, data: IReflectionAnalytics, reflection?: IReflection): Network;
    renderReflections(data: IReflection[]): void;
}
export declare function buildExperimentAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsData): Promise<void>;
