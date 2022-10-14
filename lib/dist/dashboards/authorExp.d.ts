import { IAnalytics, IAuthorAnalyticsData, ITags, IReflectionAnalytics } from "../data/data.js";
import { Dashboard } from "./authorControl.js";
import { IAuthorAnalyticsDataRaw } from "../data/db.js";
import { Help } from "../charts/help.js";
import { Sort } from "../interactions/sort.js";
export declare class ExperimentalDashboard extends Dashboard {
    tags: ITags[];
    reflectionAnalytics: IReflectionAnalytics[];
    analytics: IAnalytics;
    sorted: string;
    sort: Sort;
    help: Help;
    constructor(data: IAuthorAnalyticsData);
    preloadTags(entries: IAuthorAnalyticsData): ITags[];
    handleTags(): void;
    handleTagsColours(): void;
    extendTimeline(dashboard: ExperimentalDashboard): void;
    extendNetwork(dashboard: ExperimentalDashboard): import("../charts/author/network.js").Network<ExperimentalDashboard>;
    extendReflections(dashboard: ExperimentalDashboard): void;
    private handleFilterButton;
    private updateReflectionNodesData;
    private updateAnalyticsData;
}
export declare function buildExperimentAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsDataRaw): Promise<void>;
