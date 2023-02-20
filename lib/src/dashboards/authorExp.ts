import { select, selectAll, drag } from "d3";
import { IAnalytics, INodes, IAuthorAnalyticsData, ITags, IReflectionAnalytics, GroupByType } from "../data/data";
import { Dashboard } from "./authorControl";
import { Tutorial, TutorialData } from "../utils/tutorial";
import { IAuthorAnalyticsEntriesRaw, IAuthorEntriesRaw } from "../data/db";
import { NodeType } from "../data/data";

export class ExperimentalDashboard extends Dashboard {
    tags: ITags[]
    reflectionAnalytics: IReflectionAnalytics[]
    analytics: IAnalytics
    constructor(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]) {
        super(entriesRaw, analyticsRaw)
        this.network.extend = this.extendNetwork.bind(this)
        this.extendNetwork()
        this.reflections.extend = this.extendReflections.bind(this)
        this.extendReflections()
    }
    handleMultiUser(entries: IAuthorAnalyticsData[]): void {
        const extendFunction = (e: any, d: IAuthorAnalyticsData) => {
            this.preloadTags(d)
            this.reflectionAnalytics = d.reflections
            this.analytics = d.analytics
            const reflectionsData = this.updateReflectionNodesData()
            this.reflections.data = reflectionsData
            this.network.zoom.resetZoom()
            this.network.data = this.updateAnalyticsData()
        }
        super.handleMultiUser(entries, extendFunction)
    }
    preloadTags(entries: IAuthorAnalyticsData): ITags[] {
        this.tags = super.preloadTags(entries, true).filter(d => d.selected)
        this.reflectionAnalytics = entries.reflections
        this.analytics = entries.analytics
        this.handleTags()
        this.handleTagsColours()
        this.handleGroupTags()
        return this.tags
    }
    handleTags(): void {
        const _this = this;
        selectAll("#tags input[type=checkbox]").on("change", (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                _this.tags.find(c => c.key === target.value).selected = true
            } else {
                _this.tags.find(c => c.key === target.value).selected = false
            }

            const reflectionsData = _this.updateReflectionNodesData()
            const nodes = _this.network.clicking.clicked ? _this.reflections.nodes : null
            _this.reflections.data = reflectionsData
            _this.network.data = _this.updateAnalyticsData()
            if(nodes !== null) {
                _this.network.clicking.removeClick()
                _this.reflections.nodes = nodes
                _this.network.clicking.clicked = true
                _this.network.elements.content.classed("clicked", (d: INodes) => nodes.map(c => c.idx).includes(d.idx))
                _this.network.openNodes(nodes)
            }
        })
    }
    handleTagsColours(): void {
        const _this = this;
        selectAll("#tags input[type=color]").on("change", (e: Event) => {
            const target = e.target as HTMLInputElement
            const key = target.id.replace("colour-", "")
            _this.tags.find(c => c.key === key).properties["color"] = target.value
            const reflectionsData = _this.updateReflectionNodesData()
            const nodes = _this.network.clicking.clicked ? _this.reflections.nodes : null
            _this.reflections.data = reflectionsData
            _this.network.data = _this.updateAnalyticsData()
            if(nodes !== null) {
                _this.reflections.nodes = nodes
            }
        });
    }
    handleGroupTags() {
        select(`#${this.network.id} #group-tags`).on("change", (e: Event) => {
            const target = e.target as HTMLInputElement
            if (target.checked) {
                this.network.groupByKey = GroupByType.Code
            } else {
                this.network.groupByKey = GroupByType.Ref
            }
            this.network.data = this.updateAnalyticsData()
        })
    }
    extendNetwork() {
        const _this = this
        const chart = _this.network

        select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton());

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick()
            _this.reflections.nodes = undefined
        });

        const onClick = function(e: Event, d: INodes) {
            if (select(this).attr("class").includes("clicked")) {
                chart.clicking.removeClick()
                _this.reflections.nodes = undefined
            }

            chart.clicking.removeClick()
            chart.clicking.clicked = true
            let nodes = chart.getTooltipNodes(_this.analytics, d)
            chart.openNodes(nodes)

            chart.elements.content.classed("clicked", (d: INodes) => nodes.map(c => c.idx).includes(d.idx))

            if (chart.groupByKey === GroupByType.Code) {
                _this.reflections.nodes = _this.analytics.nodes.filter(d => d.refId == nodes[0].refId && d.nodeCode == nodes[0].nodeCode)
            } else {
                _this.reflections.nodes = nodes
            }          
            
            document.querySelector(`#ref-${d.refId}`).scrollIntoView({ behavior: 'smooth', block: 'start' })
            select(`#ref-${d.refId} i`).classed("selected", d.nodeType == NodeType.Ref)
        }
        chart.clicking.enableClick(onClick)
    }
    extendReflections(): void {
        select(`#reflections .badge`).on("click", () => this.handleFilterButton())
    }
    private handleFilterButton(): void {
        const reflectionsData = this.updateReflectionNodesData()
        this.reflections.data = reflectionsData
        this.network.clicking.removeClick()
        this.network.data = this.updateAnalyticsData()
    };
    private updateReflectionNodesData(analytics?: IReflectionAnalytics): IReflectionAnalytics[] {
        const reflectionAnalytics = analytics === undefined ? 
            this.reflectionAnalytics : 
            this.reflectionAnalytics.filter(d => d.refId === analytics.refId)
        return reflectionAnalytics.map(c => {
            c.nodes = c.nodes.map(r => {
                let tag = this.tags.find(d => d.key === r.nodeCode)
                r.selected = tag.selected
                r.properties["color"] = tag.properties["color"]
                return r
            })
            c.nodeTags = c.nodeTags.map(r => {
                let tag = this.tags.find(d => d.key === r.key)
                r.selected = tag.selected
                r.properties["color"] = tag.properties["color"]
                return r
            })
            return {"refId": c.refId, "point": c.point, "text": c.text, "timestamp": c.timestamp, "nodes": c.nodes, "nodeTags": c.nodeTags}
        })
    }
    private updateAnalyticsData(): IAnalytics {
        let nodes = this.analytics.nodes.map(c => {
            let name = c.name !== null ? c.name : c.nodeCode
            let tag = this.tags.find(d => d.name === name)
            c.selected = tag.selected
            c.properties["color"] = tag.properties["color"]
            return c
        })
        let edges = (this.analytics.edges).map(c => {
            let source = typeof c.source === "number" ? nodes.find(d => d.idx == c.source) : c.source
            let sourceName = source.name !== null ? source.name : source.nodeCode
            let target = typeof c.target === "number" ? nodes.find(d => d.idx == c.target) : c.target
            let targetName = target.name !== null ? target.name : target.nodeCode
            c.selected = this.tags.find(d => d.name === sourceName)?.selected && this.tags.find(d => d.name === targetName)?.selected
            return c
        })
        return { "reflections": this.analytics.reflections, "nodes": nodes, "edges": edges }
    }
}

export function buildExperimentAuthorAnalyticsCharts(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]) {
    const dashboard = new ExperimentalDashboard(entriesRaw, analyticsRaw)

    //Handle timeline chart help
    dashboard.network.help.helpPopover(`<b>Network diagram</b><br>
    A network diagram that shows the phrases and tags associated to your reflections<br>When grouped the size of the circle increases depending on the amount of nodes contained in that tag. The data represented are your <i>reflections over time</i><br>
    <u><i>Hover</i></u> over the network nodes for information on demand<br>
    <u><i>Click</i></u> to fill the background colour the nodes in the reflection text<br>
    <u><i>Group tags</i></u> to reduce or increase the amount of nodes<br>
    <u><i>Zoom</i></u> to explore the nodes closely`) 

    //Handle reflections chart help
    dashboard.reflections.help.helpPopover(`<b>Reflections</b><br>
        Your reflections are shown sorted by time. The words with associated tags have a different outline colour<br>
        The reflections can be sorted by time or reflection point`)
    
    new Tutorial([new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
        new TutorialData("#sort-reflections .sort-by", "Sort reflections by date or reflection state point"),
        new TutorialData("#reflections .reflection-text span", "Phrases outlined with a colour that matches the tags"),
        new TutorialData("#tags li", "Select which tags to see, change the colours if you like and find more information about the tag"),
        new TutorialData("#network #group-tags-div", "Group network nodes that are part of the same tag. The size of the node reflects how many nodes are grouped"),
        new TutorialData("#network .network-node-group", "Hover for information on demand. Click to fill the background colour of the nodes in the reflection text"),
        new TutorialData("#network .zoom-buttons", "Click to zoom in and out. To pan the chart click, hold and move left or right in any blank area")])
}