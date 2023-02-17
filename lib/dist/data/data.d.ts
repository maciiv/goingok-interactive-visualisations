import { IChartHelp } from "../charts/chartBase";
export interface IReflection {
    refId: number;
    timestamp: Date;
    point: number;
    text: string;
}
export interface IReflectionAuthor extends IReflection {
    pseudonym: string;
    selected: boolean;
}
export interface IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    createDate: Date;
    colour: string;
    selected: boolean;
    usersTotal: number;
    refTotal: number;
    ruRate: number;
    mean: number;
}
export declare class AdminAnalyticsData implements IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    createDate: Date;
    colour: string;
    selected: boolean;
    usersTotal: number;
    refTotal: number;
    ruRate: number;
    mean: number;
    constructor(group: string, value: IReflectionAuthor[], createDate?: Date, colour?: string, selected?: boolean);
}
export interface ITimelineData extends IReflectionAuthor {
    colour: string;
    group: string;
}
export declare class TimelineData implements ITimelineData {
    refId: number;
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
    selected: boolean;
    colour: string;
    group: string;
    constructor(data: IReflectionAuthor, colour: string, group: string);
}
export interface IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
}
export declare enum NodeType {
    Sys = "SYS",
    Usr = "USR",
    Grp = "GRP",
    Ref = "REF"
}
export declare enum EdgeType {
    Sys = "SYS",
    Usr = "USR",
    Grp = "GRP",
    Ref = "REF"
}
export declare enum GroupByType {
    Ref = "refId",
    Code = "nodeCode"
}
export interface INodesBase {
    idx: number;
    nodeType: NodeType;
    nodeCode: string;
    refId: number;
    startIdx?: number;
    endIdx?: number;
}
export interface INodes extends INodesBase, d3.SimulationNodeDatum {
    expression: string;
    labelType: string;
    name?: string;
    description: string;
    selected?: boolean;
    properties: any;
    total: number;
}
export interface IEdgesBase<T> extends d3.SimulationLinkDatum<T> {
    idx: number;
    edgeType: EdgeType;
    directional: boolean;
    weight: number;
    source: T;
    target: T;
}
export interface IEdges<T> extends IEdgesBase<T> {
    labelType: string;
    name: string;
    description: string;
    selected?: boolean;
    properties: any;
}
export interface IAnalytics {
    reflections: IReflection[];
    nodes: INodes[];
    edges: IEdges<number | INodes>[];
}
export declare class Analytics implements IAnalytics {
    reflections: IReflection[];
    nodes: INodes[];
    edges: IEdges<number | INodes>[];
    constructor(reflections: IReflection[], nodes: INodes[], edges: IEdges<number | INodes>[]);
}
export interface IAuthorAnalytics extends IAnalytics {
    groupByKey?: GroupByType;
}
export declare class AuthorAnalytics extends Analytics implements IAuthorAnalytics {
    groupByKey?: GroupByType;
    constructor(reflections: IReflection[], nodes: INodes[], edges: IEdges<number | INodes>[], groupByKey?: GroupByType);
    private groupByNodeCode;
    private addRefNodesEdges;
}
export interface IReflectionAnalytics extends IReflection {
    nodes: INodes[];
    nodeTags: INodeTags[];
}
export interface INodeTags extends ITags, d3.SimulationNodeDatum {
    refId: number;
    total: number;
}
export interface ITags {
    key: string;
    name: string;
    properties: any;
    selected?: boolean;
    description: string;
    help: IChartHelp;
}
export interface IAuthorAnalyticsData {
    pseudonym: string;
    reflections: IReflectionAnalytics[];
    analytics: IAuthorAnalytics;
}
export declare class AuthorAnalyticsData implements IAuthorAnalyticsData {
    pseudonym: string;
    reflections: IReflectionAnalytics[];
    analytics: IAuthorAnalytics;
    constructor(reflections: IReflection[], analytics: IAuthorAnalytics, pseudonym: string, colourScale: Function);
    private processColour;
}
