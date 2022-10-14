import { IReflectionAuthor, AdminAnalyticsData, AuthorAnalyticsData, IReflection, IAnalytics } from "./data.js";

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

export interface IAuthorAnalyticsDataRaw {
    reflections: IReflectionAuthorRaw[]
    analytics: IAnalytics
    transformData(): AuthorAnalyticsData
}

export class AuthorAnalyticsDataRaw implements IAuthorAnalyticsDataRaw {
    reflections: IReflectionAuthorRaw[]
    analytics: IAnalytics
    constructor(data: AuthorAnalyticsDataRaw) {
        this.reflections = data.reflections
        this.analytics = data.analytics
    }
    transformData(colourScale?: Function): AuthorAnalyticsData {
        return new AuthorAnalyticsData(this.reflections.map(d => { 
            return { "refId": parseInt(d.refId), "timestamp": new Date(d.timestamp), "point": parseInt(d.point), "text": d.text } 
        }) as IReflection[], this.analytics, colourScale)
    }
}