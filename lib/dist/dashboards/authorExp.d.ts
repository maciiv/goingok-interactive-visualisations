import { IAuthorAnalyticsData, ITags, IReflectionAnalytics, IAuthorAnalytics } from "../data/data";
import { Dashboard } from "./authorControl";
import { IAuthorAnalyticsEntriesRaw, IAuthorEntriesRaw } from "../data/db";
export declare class ExperimentalDashboard extends Dashboard {
    tags: ITags[];
    reflectionAnalytics: IReflectionAnalytics[];
    analytics: IAuthorAnalytics;
    constructor(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]);
    handleMultiUser(entries: IAuthorAnalyticsData[]): void;
    preloadTags(entries: IAuthorAnalyticsData): ITags[];
    handleTags(): void;
    handleTagsColours(): void;
    handleGroupTags(): void;
    extendNetwork(): void;
    private updateReflectionNodesData;
    private updateAnalyticsData;
    private logReflectionEntry;
}
export declare function buildExperimentAuthorAnalyticsCharts(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]): void;
