import { scaleLinear } from "d3";
import { calculateMean, groupBy } from "../utils/utils";

export interface IReflection {
    refId: number
    timestamp: Date
    point: number
    text: string
}

export interface IReflectionAuthor extends IReflection {
    pseudonym: string;
    selected: boolean
}

export interface IAdminAnalyticsData {
    group: string
    value: IReflectionAuthor[]
    createDate: Date
    colour: string
    selected: boolean
    usersTotal: number
    refTotal: number
    ruRate: number
    mean: number
}

export class AdminAnalyticsData implements IAdminAnalyticsData {
    group: string
    value: IReflectionAuthor[]
    createDate: Date
    colour: string
    selected: boolean
    usersTotal: number
    refTotal: number
    ruRate: number
    mean: number
    constructor(group: string, value: IReflectionAuthor[], createDate: Date = undefined, colour: string = undefined, selected: boolean = true) {
        this.group = group
        this.value = value
        this.createDate = createDate
        this.colour = colour
        this.selected = selected
        let uniqueUsers = groupBy(value, "pseudonym")
        this.usersTotal = uniqueUsers.length
        this.refTotal = value.length
        this.mean = Math.round(calculateMean(value.map(r => r.point)))
        this.ruRate = Math.round(value.length / uniqueUsers.length * 100) / 100
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
    bin: d3.Bin<number, number>
    percentage: number
}

export class HistogramData extends AdminAnalyticsData implements IHistogramData {    
    bin: d3.Bin<number, number>
    percentage: number
    constructor(value: IReflectionAuthor[], group: string, colour: string, bin: d3.Bin<number, number>, percentage: number) {
        super(group, value, undefined, colour)
        this.bin = bin
        this.percentage = percentage
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
    nodeType: string
    refId: number
    startIdx?: number
    endIdx?: number
    expression: string
    labelType: string
    name: string
    description: string
    selected?: boolean
    properties: any
}

export interface IEdges<T> extends d3.SimulationLinkDatum<T> {
    idx: number
    edgeType: string
    directional: boolean
    weight: number
    labelType: string
    name: string
    description: string
    selected?: boolean
    properties: any
    isReflection?: boolean
}

export interface IAnalytics {
    name: string
    description: string
    nodes: INodes[]
    edges: IEdges<INodes>[]
}

export interface IReflectionAnalytics extends IReflection {
    nodes: INodes[]
    nodeTags: INodeTags[]
}

export interface INodeTags extends ITags, d3.SimulationNodeDatum {
    refId: number
    total: number
}

export interface ITags extends d3.SimulationNodeDatum {
    name: string
    properties: any
    selected?: boolean
}

export interface IAuthorAnalyticsData {
    pseudonym: string
    reflections: IReflectionAnalytics[]
    analytics: IAnalytics
}

export class AuthorAnalyticsData implements IAuthorAnalyticsData {
    pseudonym: string
    reflections: IReflectionAnalytics[]
    analytics: IAnalytics
    constructor(reflections: IReflection[], analytics: IAnalytics, pseudonym: string, colourScale: Function) {
        this.reflections = reflections.map(c => { 
            let nodes = JSON.parse(JSON.stringify(analytics.nodes.filter(r => r.refId === c.refId))) as INodes[]
            nodes.forEach(r => this.processColour(r, colourScale))
            let tags = groupBy(nodes, "name").map(r => { 
                return {
                    "name": r.key, 
                    "refId": c.refId,
                    "properties": r.value[0].properties, 
                    "total": r.value.length
                } as INodeTags}
                )
            return {"refId": c.refId, "timestamp": c.timestamp, "point": c.point, "text": c.text, "nodes": nodes, "nodeTags": tags }
        })
        analytics.nodes.forEach(r => this.processColour(r, colourScale))
        this.analytics = analytics
        this.pseudonym = pseudonym
    }
    private processColour(node: INodes, colourScale: Function): INodes {
        if (node.properties["color"] === undefined) {
            node.properties = {"color": colourScale(node.name)}
        }
        return node;
    }
}