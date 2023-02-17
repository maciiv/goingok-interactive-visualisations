import { IChartHelp } from "../charts/chartBase";
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

export interface IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
}

export enum NodeType {
    Sys = "SYS",
    Usr = "USR",
    Grp = "GRP",
    Ref = "REF"
}

export enum EdgeType {
    Sys = "SYS",
    Usr = "USR",
    Grp = "GRP",
    Ref = "REF"
}

export enum GroupByType {
    Ref = "refId",
    Code = "nodeCode"
}

export interface INodesBase {
    idx: number
    nodeType: NodeType
    nodeCode: string
    refId: number
    startIdx?: number
    endIdx?: number
}

export interface INodes extends INodesBase, d3.SimulationNodeDatum {    
    expression: string
    labelType: string
    name?: string
    description: string
    selected?: boolean
    properties: any
    total: number
}

export interface IEdgesBase<T> extends d3.SimulationLinkDatum<T> {
    idx: number
    edgeType: EdgeType
    directional: boolean
    weight: number
    source: T
    target: T
}

export interface IEdges<T> extends IEdgesBase<T> {
    labelType: string
    name: string
    description: string
    selected?: boolean
    properties: any
}

export interface IAnalytics {
    reflections: IReflection[]
    nodes: INodes[]
    edges: IEdges<number | INodes>[]
}

export class Analytics implements IAnalytics {
    reflections: IReflection[]
    nodes: INodes[]
    edges: IEdges<number | INodes>[]
    constructor(reflections: IReflection[], nodes: INodes[], edges: IEdges<number | INodes>[]) {
        this.reflections = reflections
        this.nodes = nodes
        this.edges = edges
    }
}

export interface IAuthorAnalytics extends IAnalytics { 
    groupByKey?: GroupByType
}

export class AuthorAnalytics extends Analytics implements IAuthorAnalytics {
    groupByKey?: GroupByType
    constructor(reflections: IReflection[], nodes: INodes[], edges: IEdges<number | INodes>[], groupByKey?: GroupByType) {
        super(reflections, nodes, edges)
        this.groupByKey = groupByKey
        if (groupByKey === GroupByType.Code) {
            const nodesEdges = this.groupByNodeCode()
            this.nodes = nodesEdges.nodes
            this.edges = nodesEdges.edges
        }
        this.addRefNodesEdges()
    }
    private groupByNodeCode(): { nodes: INodes[], edges: IEdges<INodes>[] } {
        const reflectionNodes = this.reflections.map(r => {
            let nodes = [] as INodes[]
            groupBy(this.nodes.filter(c => c.refId === r.refId), GroupByType.Code).forEach(d => {
                nodes.push({
                    "idx": - this.reflections.length - 1,
                    "nodeCode": d.key,
                    "nodeType": NodeType.Grp,
                    "refId": r.refId,
                    "expression": d.value[0].name !== null ? `${d.value[0].name} : ${d.value.length}` : `${d.key} : ${d.value.length}`,
                    "properties": d.value[0].properties,
                    "total": d.value.length,
                    "selected": true
                } as INodes)
            })
            return nodes
        })
        return { "nodes": reflectionNodes.flat(), "edges": [] }
    }
    private addRefNodesEdges() {
        let nodes = this.reflections.map((d, i) => {
            return {
                "idx": -i - 1,
                "nodeCode": d.refId.toString(),
                "nodeType": NodeType.Ref,
                "refId": d.refId,
                "expression": d.timestamp.toDateString(),
                "properties": {"color": "#999999"},
                "total": 1
            } as INodes
        })
        let edges = nodes.map((d, i) => {
            let nodesTarget = this.nodes.filter(c => c.refId.toString() == d.nodeCode)
            return nodesTarget.map((c, x) => {
                return {
                    "idx": -x - 1,
                    "edgeType": EdgeType.Ref,
                    "source": d,
                    "target": c
                } as IEdges<INodes>
            })
        })
        this.nodes = this.nodes.concat(nodes)
        this.edges = this.edges.concat(edges.flat())
    }
}

export interface IReflectionAnalytics extends IReflection {
    nodes: INodes[]
    nodeTags: INodeTags[]
}

export interface INodeTags extends ITags, d3.SimulationNodeDatum {
    refId: number
    total: number
}

export interface ITags {
    key: string
    name: string
    properties: any
    selected?: boolean
    description: string
    help: IChartHelp
}

export interface IAuthorAnalyticsData {
    pseudonym: string
    reflections: IReflectionAnalytics[]
    analytics: IAuthorAnalytics
}

export class AuthorAnalyticsData implements IAuthorAnalyticsData {
    pseudonym: string
    reflections: IReflectionAnalytics[]
    analytics: IAuthorAnalytics
    constructor(reflections: IReflection[], analytics: IAuthorAnalytics, pseudonym: string, colourScale: Function) {
        this.reflections = reflections.map(c => { 
            let nodes = JSON.parse(JSON.stringify(analytics.nodes.filter(r => r.refId === c.refId))) as INodes[]
            nodes.forEach(r => this.processColour(r, colourScale))
            let tags = groupBy(nodes, "nodeCode").map(r => { 
                return {
                    "key": r.key,
                    "name": r.value[0].name !== null ? r.value[0].name : r.key, 
                    "refId": c.refId,
                    "properties": r.value[0].properties, 
                    "total": r.value.length,
                    "selected": true
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
            node.properties = {"color": colourScale(node.name !== null ? node.name : node.nodeCode)}
        }
        return node;
    }
}