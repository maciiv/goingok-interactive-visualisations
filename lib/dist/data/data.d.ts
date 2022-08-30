export interface IReflectionAuthor {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}
export interface IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    getUsersData(): AdminAnalyticsData;
}
export declare class AdminAnalyticsData implements IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    constructor(group: string, value: IReflectionAuthor[], createDate?: Date, colour?: string, selected?: boolean);
    getUsersData(): AdminAnalyticsData;
}
export interface IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
}
export declare class DataStats implements IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
    constructor(stat: string, displayName: string, value: number | Date);
}
export interface IAdminAnalyticsDataStats extends IAdminAnalyticsData {
    stats: IDataStats[];
    roundDecimal(value: number): string;
    getStat(stat: string): IDataStats;
}
export declare class AdminAnalyticsDataStats extends AdminAnalyticsData implements IAdminAnalyticsDataStats {
    stats: IDataStats[];
    constructor(entries: IAdminAnalyticsData);
    roundDecimal(value: number): string;
    getStat(stat: string): IDataStats;
}
