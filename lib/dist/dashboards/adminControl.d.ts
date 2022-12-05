import { IAdminAnalyticsData } from "../data/data";
import { IAdminAnalyticsDataRaw } from "../data/db";
import { Histogram } from "../charts/admin/histogram";
import { BarChart } from "../charts/admin/barChart";
import { Timeline } from "../charts/admin/timeline";
import { Users } from "../charts/admin/users";
import { Totals } from "../charts/admin/totals";
export declare class Dashboard {
    totals: Totals;
    barChart: BarChart;
    histogram: Histogram;
    timeline: Timeline;
    users: Users;
    constructor(entriesRaw: IAdminAnalyticsDataRaw[]);
    renderError(e: any, chartId: string, css?: string): void;
    sidebarBtn(): void;
    preloadGroups(allEntries: IAdminAnalyticsData[], enable?: boolean): IAdminAnalyticsData[];
}
export declare function buildControlAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): void;
