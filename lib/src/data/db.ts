import { IReflectionAuthor, AdminAnalyticsData, AuthorAnalyticsData, IReflection, IAnalytics, INodes, IEdges, Analytics } from "./data";

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

export interface IAnalyticsEntriesRaw {
    nodes: INodes[]
    edges: IEdges<number | INodes>[]
}

export interface IAuthorAnalyticsEntriesRaw {
    pseudonym: string
    analytics: IAnalyticsEntriesRaw
}

export interface IAuthorAnalyticsDataRaw {
    pseudonym: string
    reflections: IReflectionAuthorRaw[]
    analytics: IAnalyticsEntriesRaw
    transformData(): AuthorAnalyticsData
}

export class AuthorAnalyticsDataRaw implements IAuthorAnalyticsDataRaw {
    pseudonym: string
    reflections: IReflectionAuthorRaw[]
    analytics: IAnalyticsEntriesRaw
    constructor(entries: IReflectionAuthorRaw[], analytics: IAuthorAnalyticsEntriesRaw) {
        this.pseudonym = analytics.pseudonym
        this.reflections = entries
        this.analytics = analytics.analytics
    }
    transformData(colourScale?: Function): AuthorAnalyticsData {
        let reflections = this.reflections.map(d => { 
            return { 
                "refId": parseInt(d.refId), 
                "timestamp": new Date(d.timestamp), 
                "point": parseInt(d.point), 
                "text": d.text 
            } as IReflection
        })
        return new AuthorAnalyticsData(reflections, new Analytics(reflections, this.analytics.nodes, this.analytics.edges), this.pseudonym, colourScale)
    }
}