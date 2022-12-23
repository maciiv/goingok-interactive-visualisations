import { IAuthorAnalyticsData, ITags } from "../data/data";
import { Network } from "../charts/author/network";
import { TimelineNetwork } from "../charts/author/timelineNetwork";
import { IAuthorAnalyticsEntriesRaw, IAuthorEntriesRaw } from "../data/db";
import { Reflections } from "../charts/author/reflections";
export declare class Dashboard {
    timeline: TimelineNetwork;
    network: Network;
    reflections: Reflections;
    constructor(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]);
    renderError(e: any, chartId: string, css?: string): void;
    resizeTimeline(): void;
    handleMultiUser(entries: IAuthorAnalyticsData[], extend?: Function): void;
    preloadTags(entries: IAuthorAnalyticsData, enable?: boolean): ITags[];
}
export declare function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]): void;
