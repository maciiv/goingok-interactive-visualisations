import d3 from "d3";
import { Help } from "../utils/help.js";
import { IAuthorAnalyticsData, ITags } from "../data/data.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
import { AuthorAnalyticsDataRaw, IAuthorAnalyticsEntriesRaw, IAuthorEntriesRaw } from "../data/db.js";
import { Reflections } from "../charts/author/reflections.js";
import { groupBy } from "../utils/utils.js";

export class Dashboard {
    timeline: TimelineNetwork
    network: Network
    reflections: Reflections
    constructor(data: IAuthorAnalyticsData[]) {
        this.resizeTimeline()
        this.timeline = new TimelineNetwork(data[0].reflections)
        this.network = new Network(data[0].analytics, data[0].reflections.map(d => d.timestamp))
        this.reflections = new Reflections(data[0].reflections)
        this.preloadTags(data[0])
        this.handleMultiUser(data)
    }
    resizeTimeline(): void {
        let height = document.querySelector("#reflection-entry").getBoundingClientRect().height
        document.querySelector("#timeline .chart-container").setAttribute("style", `min-height:${height - 80}px`)
    }
    handleMultiUser(entries: IAuthorAnalyticsData[], extend?: Function): void {
        if (entries.length > 1) {
            d3.select(".multi-user button")
                .classed("dropdown-toggle", true)
                .property("disabled", false)
            d3.select(".multi-user div").selectAll("a")
                .data(entries)
                .enter()
                .append("a")
                .attr("class", "dropdown-item")
                .text(d => d.pseudonym)
                .on("click", (e, d) => {
                    if (extend === undefined) {
                        this.timeline.data = d.reflections
                        this.reflections.data = d.reflections
                        if (d.analytics.nodes.some(d => d.index === undefined)) this.network.processSimulation(d.analytics)
                        this.network.data = d.analytics
                    } else {
                        extend(e, d)
                    }
                    
                    d3.select(".multi-user button")
                        .text(d.pseudonym)
                })
        }
    }
    preloadTags(entries: IAuthorAnalyticsData, enable: boolean = false): ITags[] {
        let tags = groupBy(entries.analytics.nodes, "name").map(r => { return {"name": r.key, "properties": r.value[0].properties, "selected": r.value[0].selected}})
        d3.select("#tags").selectAll("li")
            .data(tags)
            .join(
                enter => enter.append("li")
                    .attr("class", "mx-3")
                    .append("div")
                    .attr("class", "input-group")
                    .call(div => div.append("input")
                        .attr("type", "text")
                        .attr("class", "form-control tag-row")
                        .attr("value", d => d.name)
                        .property("disabled", true))
                    .call(div => div.append("div")
                        .attr("class", "input-group-append")
                        .append("div")
                        .attr("class", "input-group-text tag-row")
                        .append("input")
                        .attr("id", d => `colour-${d.name}`)
                        .attr("type", "color")
                        .attr("value", d => d.properties["color"])
                        .property("disabled", !enable)),
                update => update,
                exit => exit.remove()
            )
        return tags
    }
}

export async function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]) {
    const loading = new Loading()
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10)
    const entries = entriesRaw.map(d => new AuthorAnalyticsDataRaw(d.reflections, analyticsRaw.find(c => c.pseudonym == d.pseudonym)).transformData(colourScale))
    await drawCharts(entries)
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#reflections .reflection-text span", "Phrases outlined with a colour that matches the tags"),
    new TutorialData("#network .network-node-group", "Hover for information on demand"),
    new TutorialData("#network .zoom-buttons", "Click to zoom in and out. To pan the chart click, hold and move left or right in any blank area")]);
    loading.isLoading = false

    async function drawCharts(data: IAuthorAnalyticsData[]) {
        const dashboard = new Dashboard(data)
        const help = new Help()

        //Handle timeline chart help
        help.helpPopover(dashboard.network.id, `<b>Network diagram</b><br>
            A network diagram that shows the phrases and tags associated to your reflections<br>
            The data represented are your <i>reflections over time</i><br>
            <u><i>Hover</i></u> over the network nodes for information on demand`) 

        //Handle timeline chart help
        help.helpPopover(dashboard.timeline.id, `<b>Timeline</b><br>
            Your reflections and the tags associated to them are shown over time<br>
            <u><i>Hover</i></u> over a reflection point for information on demand`)

        //Handle users histogram chart help
        help.helpPopover(dashboard.reflections.id, `<b>Reflections</b><br>
            Your reflections are shown sorted by time. The words with associated tags have a different outline colour`)
    }
}