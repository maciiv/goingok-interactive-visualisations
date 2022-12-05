import { IReflectionAuthor, AdminAnalyticsData, AuthorAnalyticsData, IReflection, IAnalytics } from "./data";

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

export interface IAuthorEntriesRaw {
    pseudonym: string
    reflections: IReflectionAuthorRaw[]
}

export interface IAuthorAnalyticsEntriesRaw {
    pseudonym: string
    analytics: IAnalytics
}

export interface IAuthorAnalyticsDataRaw {
    pseudonym: string
    reflections: IReflectionAuthorRaw[]
    analytics: IAnalytics
    transformData(): AuthorAnalyticsData
}

export class AuthorAnalyticsDataRaw implements IAuthorAnalyticsDataRaw {
    pseudonym: string
    reflections: IReflectionAuthorRaw[]
    analytics: IAnalytics
    constructor(entries: IReflectionAuthorRaw[], analytics: IAuthorAnalyticsEntriesRaw) {
        this.pseudonym = analytics.pseudonym
        this.reflections = entries
        this.analytics = analytics.analytics
    }
    transformData(colourScale?: Function): AuthorAnalyticsData {
        return new AuthorAnalyticsData(this.reflections.map(d => { 
            return { "refId": parseInt(d.refId), "timestamp": new Date(d.timestamp), "point": parseInt(d.point), "text": d.text } 
        }) as IReflection[], this.analytics, this.pseudonym, colourScale)
    }
}