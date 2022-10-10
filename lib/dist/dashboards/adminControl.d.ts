import { IAdminAnalyticsData, IAdminAnalyticsDataStats } from "../data/data.js";
import { IAdminAnalyticsDataRaw } from "../data/db.js";
import { Histogram } from "../charts/admin/histogram.js";
import { BarChart } from "../charts/admin/barChart.js";
import { Timeline } from "../charts/admin/timeline.js";
import { Users } from "../charts/admin/users.js";
import { Totals } from "../charts/admin/totals.js";
export declare class Dashboard {
    totals: Totals;
    barChart: BarChart<this>;
    histogram: Histogram<this>;
    timeline: Timeline<this>;
    users: Users;
    constructor(data: IAdminAnalyticsDataStats[]);
    sidebarBtn(): void;
    preloadGroups(allEntries: IAdminAnalyticsData[], enable?: boolean): IAdminAnalyticsData[];
}
export declare function buildControlAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;
