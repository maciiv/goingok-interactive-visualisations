import { IAuthorAnalyticsData, ITags } from "../data/data.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
import { IAuthorAnalyticsDataRaw } from "../data/db.js";
import { Reflections } from "../charts/author/reflections.js";
export declare class Dashboard {
    timeline: TimelineNetwork;
    network: Network;
    reflections: Reflections;
    constructor(data: IAuthorAnalyticsData);
    resizeTimeline(): void;
    preloadTags(entries: IAuthorAnalyticsData, enable?: boolean): ITags[];
}
export declare function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsDataRaw): Promise<void>;
