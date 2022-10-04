import { IReflectionAuthor, AdminAnalyticsData } from "./data.js";
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
