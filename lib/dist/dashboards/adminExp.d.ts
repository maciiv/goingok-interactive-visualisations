import { ChartSeries, ChartTime, ChartTimeZoom } from "../charts/chartBase.js";
import { IAdminAnalyticsData, IAdminAnalyticsDataStats } from "../data/data.js";
import { IAdminControlCharts, AdminControlCharts, Dashboard } from "./adminControl.js";
import { AdminExperimentalInteractions } from "../charts/interactions.js";
import { IAdminAnalyticsDataRaw } from "../data/db.js";
import { Histogram } from "../charts/admin/histogram.js";
import { Sort } from "../interactions/sort.js";
import { Help } from "../charts/help.js";
export interface Idashboard extends IAdminControlCharts {
    barChart: ChartSeries;
    histogram: Histogram;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted: string;
    allEntries: IAdminAnalyticsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    handleGroupsSort(): void;
    handleFilterButton(): void;
}
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
    extendBarChart(): void;
    private removeAllHelp;
    private getClickData;
}
export declare class dashboard extends AdminControlCharts implements Idashboard {
    barChart: ChartSeries;
    histogram: Histogram;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted: string;
    allEntries: IAdminAnalyticsData[];
    interactions: AdminExperimentalInteractions;
    preloadGroups(allEntries: IAdminAnalyticsData[]): IAdminAnalyticsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    handleGroupsSort(): void;
    handleFilterButton(): void;
    private getUpdatedData;
    private getClickData;
    private updateBarChart;
    private updateHistogram;
    private updateTimeline;
    private removeUserStatistics;
    private removeAllHelp;
    renderBarChart(chart: ChartSeries, data: IAdminAnalyticsDataStats[]): ChartSeries;
    renderHistogram(chart: Histogram, data: IAdminAnalyticsData[]): Histogram;
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAdminAnalyticsData[]): ChartTime;
    renderTimelineDensity(chart: ChartTime, data: IAdminAnalyticsData[]): ChartTime;
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAdminAnalyticsData[]): void;
}
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;
