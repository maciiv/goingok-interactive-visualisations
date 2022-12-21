import { IReflectionAuthor, AdminAnalyticsData, AuthorAnalyticsData, INodes, IEdges } from "./data";
export interface IReflectionAuthorRaw {
    refId: string;
    timestamp: string;
    pseudonym: string;
    point: string;
    text: string;
    transformData(): IReflectionAuthor;
}
export interface IAdminAnalyticsDataRaw {
    group: string;
    value: IReflectionAuthorRaw[];
    createDate: string;
    transformData(): AdminAnalyticsData;
}
export declare class AdminAnalyticsDataRaw implements IAdminAnalyticsDataRaw {
    group: string;
    value: IReflectionAuthorRaw[];
    createDate: string;
    constructor(group: string, value: IReflectionAuthorRaw[], createDate: string);
    transformData(): AdminAnalyticsData;
}
export interface IAuthorEntriesRaw {
    pseudonym: string;
    reflections: IReflectionAuthorRaw[];
}
export interface IAnalyticsEntriesRaw {
    nodes: INodes[];
    edges: IEdges<number | INodes>[];
}
export interface IAuthorAnalyticsEntriesRaw {
    pseudonym: string;
    analytics: IAnalyticsEntriesRaw;
}
export interface IAuthorAnalyticsDataRaw {
    pseudonym: string;
    reflections: IReflectionAuthorRaw[];
    analytics: IAnalyticsEntriesRaw;
    transformData(): AuthorAnalyticsData;
}
export declare class AuthorAnalyticsDataRaw implements IAuthorAnalyticsDataRaw {
    pseudonym: string;
    reflections: IReflectionAuthorRaw[];
    analytics: IAnalyticsEntriesRaw;
    constructor(entries: IReflectionAuthorRaw[], analytics: IAuthorAnalyticsEntriesRaw);
    transformData(colourScale?: Function): AuthorAnalyticsData;
}
