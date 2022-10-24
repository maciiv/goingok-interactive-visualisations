import { IAdminAnalyticsData } from "../data/data.js";
import { Dashboard } from "./adminControl.js";
import { IAdminAnalyticsDataRaw } from "../data/db.js";
import { Help } from "../utils/help.js";
export declare class ExperimentalDashboard extends Dashboard {
    entries: IAdminAnalyticsData[];
    sorted: string;
    help: Help;
    constructor(data: IAdminAnalyticsData[]);
    preloadGroups(entries: IAdminAnalyticsData[]): IAdminAnalyticsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    private handleFilterButton;
    extendBarChart(): void;
    extendHistogram(): void;
    extendTimeline(): void;
    private removeAllHelp;
    private getClickData;
}
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;
