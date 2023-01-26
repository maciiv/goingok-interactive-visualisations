import { IAdminAnalyticsData } from "../data/data";
import { Dashboard } from "./adminControl";
import { IAdminAnalyticsDataRaw } from "../data/db";
import { Sort } from "../interactions/sort";
export declare class ExperimentalDashboard extends Dashboard {
    entries: IAdminAnalyticsData[];
    sort: Sort<IAdminAnalyticsData>;
    constructor(entriesRaw: IAdminAnalyticsDataRaw[]);
    preloadGroups(entries: IAdminAnalyticsData[]): IAdminAnalyticsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    handleGroupsSort(): void;
    private handleFilterButton;
    extendBarChart(): void;
    extendHistogram(): void;
    extendTimeline(): void;
    private removeAllHelp;
    private getClickData;
}
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;
