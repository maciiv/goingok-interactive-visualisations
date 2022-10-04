import { IReflectionAuthor, AdminAnalyticsData } from "./data.js";

export interface IReflectionAuthorRaw {
    refId: string
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

export class AdminAnalyticsDataRaw implements IAdminAnalyticsDataRaw {
    group: string;
    value: IReflectionAuthorRaw[];
    createDate: string;
    constructor(group: string, value: IReflectionAuthorRaw[], createDate: string) {
        this.group = group;
        this.value = value;
        this.createDate = createDate;
    }
    transformData(): AdminAnalyticsData {
        return new AdminAnalyticsData(this.group, this.value.map(d => {
            return {
                refId: parseInt(d.refId), timestamp: new Date(d.timestamp), pseudonym: d.pseudonym, point: parseInt(d.point), text: d.text
            }
        }) as IReflectionAuthor[], new Date(this.createDate), undefined, false);
    }
}