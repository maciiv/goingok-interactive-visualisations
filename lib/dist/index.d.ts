import * as d3 from "d3";
import { IReflectionAuthor } from "./data/data.js";
import { IAdminAnalyticsDataRaw } from "./data/db.js";
interface ITags extends d3.SimulationNodeDatum {
    start_index?: number;
    tag: string;
    phrase: string;
    colour?: string;
    end_index?: number;
    selected?: boolean;
}
interface IReflectionAnalytics {
    tags: ITags[];
    matrix: number[][];
}
export declare function buildControlAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;
export declare function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]): Promise<void>;
export declare function buildControlAuthorAnalyticsCharts(entriesRaw: IReflectionAuthor[], analyticsRaw: IReflectionAnalytics[]): Promise<void>;
export declare function buildExperimentAuthorAnalyticsCharts(entriesRaw: IReflectionAuthor[], analyticsRaw: IReflectionAnalytics[]): Promise<void>;
export {};
