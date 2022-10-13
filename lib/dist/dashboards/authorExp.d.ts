import { IAuthorExperimentalInteractions, AuthorExperimentalInteractions } from "../charts/interactions.js";
import { IAnalytics, IReflection, INodes } from "../data/data.js";
import { AuthorControlCharts, IAuthorControlCharts } from "./authorControl.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
import { IAuthorAnalyticsDataRaw } from "../data/db.js";
export interface IAuthorExperimentalCharts extends IAuthorControlCharts {
    interactions: IAuthorExperimentalInteractions;
    allAnalytics: IAnalytics[];
    timelineChart: TimelineNetwork;
    networkChart: Network;
    sorted: string;
    handleTags(): void;
    handleTagsColours(): void;
    handleReflectionsSort(): void;
}
export declare class AuthorExperimentalCharts extends AuthorControlCharts implements IAuthorExperimentalCharts {
    interactions: AuthorExperimentalInteractions;
    allAnalytics: IAnalytics[];
    timelineChart: TimelineNetwork;
    networkChart: Network;
    sorted: string;
    preloadTags(entries: IAnalytics[], enable?: boolean): INodes[];
    handleTags(): void;
    handleTagsColours(): void;
    handleReflectionsSort(): void;
    handleFilterButton(): void;
    private getUpdatedAnalyticsData;
    private getUpdatedNetworkData;
    renderTimeline(chart: TimelineNetwork, data: IReflection[], analytics: IAnalytics): TimelineNetwork;
    renderNetwork(chart: Network, data: IAnalytics, reflection?: IReflection): Network;
    renderReflections(data: IReflection[]): void;
}
export declare function buildExperimentAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsDataRaw): Promise<void>;
