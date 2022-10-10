import { calculateMean, groupBy } from "../utils/utils.js";

export interface IReflection {
    refId: number;
    timestamp: Date;
    point: number;
    text: string;
}

export interface IReflectionAuthor extends IReflection {
    pseudonym: string;
    selected: boolean
}

export interface IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    createDate: Date;
    colour: string;
    selected: boolean;
}

export class AdminAnalyticsData implements IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    createDate: Date;
    colour: string;
    selected: boolean;
    constructor(group: string, value: IReflectionAuthor[], createDate: Date = undefined, colour: string = undefined, selected: boolean = true) {
        this.group = group;
        this.value = value;
        this.createDate = createDate;
        this.colour = colour;
        this.selected = selected;
    }
}

export interface IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
}

export class DataStats implements IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
    constructor(stat: string, displayName: string, value: number | Date){
        this.stat = stat,
        this.displayName = displayName,
        this.value = value
    }
}

export interface IAdminAnalyticsDataStats extends IAdminAnalyticsData {
    stats: IDataStats[];
    getStat(stat: string): IDataStats;
}

export class AdminAnalyticsDataStats extends AdminAnalyticsData implements IAdminAnalyticsDataStats {
    stats: IDataStats[];
    constructor(entries: IAdminAnalyticsData) {
        super(entries.group, entries.value, entries.createDate, entries.colour, entries.selected);
        let uniqueUsers = groupBy(entries.value, "pseudonym");
        this.stats = [];
        this.stats.push(new DataStats("usersTotal", "Users", uniqueUsers.length))
        this.stats.push(new DataStats("refTotal", "Reflections", entries.value.length))
        this.stats.push(new DataStats("mean", "Mean", Math.round(calculateMean(entries.value.map(r => r.point)))));
        this.stats.push(new DataStats("oldRef", "Oldest reflection", new Date(Math.min.apply(null, entries.value.map(r => new Date(r.timestamp))))))
        this.stats.push(new DataStats("newRef", "Newest reflection", new Date(Math.max.apply(null, entries.value.map(r => new Date(r.timestamp))))))
        this.stats.push(new DataStats("ruRate", "Reflections per user", Math.round(entries.value.length / uniqueUsers.length * 100) / 100))
    };
    getStat(stat: string): IDataStats {
        var exists = this.stats.find(d => d.stat == stat);
        if (exists != undefined) {
            return exists;
        } else {
            return new DataStats("na", "Not found", 0);
        }
    }
}

export interface ITimelineData extends IReflectionAuthor {
    colour: string;
    group: string;
}

export class TimelineData implements ITimelineData {
    refId: number;
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
    selected: boolean
    colour: string;
    group: string;
    constructor(data: IReflectionAuthor, colour: string, group: string) {
        this.refId = data.refId;
        this.timestamp = data.timestamp;
        this.pseudonym = data.pseudonym;
        this.point = data.point;
        this.text = data.text;
        this.colour = colour;
        this.group = group;
    }
}

export interface IHistogramData extends IAdminAnalyticsData {
    bin: d3.Bin<number, number>;
    percentage: number;
}

export class HistogramData extends AdminAnalyticsData implements IHistogramData {    
    bin: d3.Bin<number, number>;
    percentage: number;
    constructor(value: IReflectionAuthor[], group: string, colour: string, bin: d3.Bin<number, number>, percentage: number) {
        super(group, bin.x0 === 0 ? value.filter(d => d.point < bin.x1) : bin.x1 === 100 ? value.filter(d => d.point > bin.x0) : value.filter(d => d.point < bin.x1 && d.point > bin.x0), undefined, colour);
        this.bin = bin;
        this.percentage = percentage;
    }
}

export interface IUserChartData {
    binName: string;
    percentage: number;
    value: IReflectionAuthor[];
    isGroup: boolean;
}

export class UserChartData implements IUserChartData {
    binName: string;
    percentage: number;
    value: IReflectionAuthor[];
    isGroup: boolean;
    constructor(bin: d3.Bin<number, number>, value: IReflectionAuthor[], percentage: number, isGroup: boolean) {
        if(bin.x0 == 0) {
            this.binName = "distressed";
        } else if(bin.x1 == 100) {
            this.binName = "soaring";
        } else {
            this.binName = "going ok";
        }
        this.percentage = percentage;
        this.isGroup = isGroup;
    }
}

export interface IClickTextData {
    clickData: {stat: IDataStats | number, group: string};
    data: {stat: IDataStats | number, group: string};
}

export class ClickTextData implements IClickTextData {
    clickData: {stat: IDataStats | number, group: string};
    data: {stat: IDataStats | number, group: string};
    constructor(clickStat: IDataStats | number, dataStat: IDataStats | number, clickGroup: string, dataGroup: string) {
        this.clickData = {stat: clickStat, group: clickGroup},
        this.data = {stat: dataStat, group: dataGroup}
    }
}

export interface INodes extends d3.SimulationNodeDatum {
    idx: number
    nodeType: string,
    refId: number,
    startIdx?: number,
    endIdx?: number,
    expression: string,
    labelType: string,
    name: string,
    description: string,
    selected?: boolean
    properties: any
}

export interface IEdges<T> extends d3.SimulationLinkDatum<T> {
    idx: number
    edgeType: string,
    directional: boolean,
    weight: number;
    labelType: string,
    name: string,
    description: string,
    selected?: boolean
    properties: any,
    isReflection?: boolean,
}

export interface IReflectionAnalytics {
    name: string,
    description: string,
    nodes: INodes[],
    edges: IEdges<INodes>[]
}