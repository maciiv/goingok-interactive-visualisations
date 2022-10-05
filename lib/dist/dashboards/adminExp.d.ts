import { IAdminAnalyticsData, IAdminAnalyticsDataStats } from "../data/data.js";
import { Dashboard } from "./adminControl.js";
import { IAdminAnalyticsDataRaw } from "../data/db.js";
import { Sort } from "../interactions/sort.js";
import { Help } from "../charts/help.js";
export declare class ExperimentalDashboard extends Dashboard {
    entries: IAdminAnalyticsData[];
    sorted: string;
    sort: Sort;
    help: Help;
    preloadGroups(entries: IAdminAnalyticsData[]): IAdminAnalyticsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    handleGroupsSort(): void;
    handleFilterButton(): void;
    constructor(data: IAdminAnalyticsDataStats[]);
    extendBarChart(dashboard: ExperimentalDashboard): void;
    extendHistogram(dashboard: ExperimentalDashboard): import("../charts/admin/histogram.js").Histogram<ExperimentalDashboard>;
    extendTimeline(dashboard: ExperimentalDashboard): import("../charts/admin/timeline.js").Timeline<ExperimentalDashboard>;
    private removeAllHelp;
    private getClickData;
}
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;