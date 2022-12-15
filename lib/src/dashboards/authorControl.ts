import { scaleOrdinal, schemeCategory10, select } from "d3";
import { Help } from "../utils/help";
import { IAuthorAnalyticsData, ITags } from "../data/data";
import { Tutorial, TutorialData } from "../utils/tutorial";
import { Network } from "../charts/author/network";
import { TimelineNetwork } from "../charts/author/timelineNetwork";
import { AuthorAnalyticsDataRaw, IAuthorAnalyticsEntriesRaw, IAuthorEntriesRaw } from "../data/db";
import { Reflections } from "../charts/author/reflections";
import { groupBy } from "../utils/utils";

export class Dashboard {
    timeline: TimelineNetwork
    network: Network
    reflections: Reflections
    constructor(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]) {
        try {
            const colourScale = scaleOrdinal(schemeCategory10)
            const data = entriesRaw.map(d => new AuthorAnalyticsDataRaw(d.reflections, analyticsRaw.find(c => c.pseudonym == d.pseudonym)).transformData(colourScale))
            this.resizeTimeline()
            try {
                this.timeline = new TimelineNetwork(data[0].reflections)
            } catch (e) {
                this.renderError(e, "timeline")
            }
            try {
                this.network = new Network(data[0].analytics, data[0].reflections.map(d => d.timestamp))
            } catch (e) {
                this.renderError(e, "network")
            }
            try {
                this.reflections = new Reflections(data[0].reflections)
            } catch (e) {
                this.renderError(e, "reflections", ".reflections-tab")
            }
            this.preloadTags(data[0])
            this.handleMultiUser(data)

        } catch (e) {
            this.renderError(e, "timeline")
            this.renderError(e, "network")
            this.renderError(e, "reflections", ".reflections-tab")
        }
    }
    renderError(e: any, chartId: string, css?: string) {
        select(`#${chartId} ${css === undefined ? ".chart-container" : css}`)
            .text(`There was an error rendering the chart. ${e}`)
    }
    resizeTimeline(): void {
        let height = document.querySelector("#reflection-entry").getBoundingClientRect().height
        document.querySelector("#timeline .chart-container").setAttribute("style", `min-height:${height - 80}px`)
    }
    handleMultiUser(entries: IAuthorAnalyticsData[], extend?: Function): void {
        if (entries.length > 1) {
            select(".multi-user button")
                .classed("dropdown-toggle", true)
                .property("disabled", false)
            select(".multi-user div").selectAll("a")
                .data(entries)
                .enter()
                .append("a")
                .attr("class", "dropdown-item")
                .text(d => d.pseudonym)
                .on("click", (e, d) => {
                    if (extend === undefined) {
                        this.preloadTags(d)
                        this.timeline.data = d.reflections
                        this.reflections.data = d.reflections
                        if (d.analytics.nodes.some(d => d.index === undefined)) this.network.processSimulation(d.analytics)
                        this.network.data = d.analytics
                    } else {
                        extend(e, d)
                    }
                    
                    select(".multi-user button")
                        .text(d.pseudonym)
                })
        }
    }
    preloadTags(entries: IAuthorAnalyticsData, enable: boolean = false): ITags[] {
        let tags = groupBy(entries.analytics.nodes, "name").map(r => { return {"name": r.key, "properties": r.value[0].properties, "selected": r.value[0].selected}})
        select("#tags").selectAll("li")
            .data(tags)
            .join(
                enter => enter.append("li")
                    .append("div")
                    .attr("class", "input-group input-group-sm")
                    .call(div => div.append("div")
                        .attr("class", "form-check me-2")
                        .call(div => enable ? div.append("input")
                            .attr("class", "form-check-input")
                            .attr("id", d => `tag-${d.name}`)
                            .attr("type", "checkbox")
                            .attr("value", d => d.name)
                            .property("checked", true) :  null)
                        .call(div => div.append("label")
                            .attr("class", "form-check-label")
                            .attr("for", d => `tag-${d.name}`)
                            .text(d => d.name)))
                    .call(div => div.append("input")
                        .attr("class", "tag-color-picker")
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

export function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorEntriesRaw[], analyticsRaw: IAuthorAnalyticsEntriesRaw[]) {
    const dashboard = new Dashboard(entriesRaw, analyticsRaw)
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
    
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#reflections .reflection-text span", "Phrases outlined with a colour that matches the tags"),
    new TutorialData("#network .network-node-group", "Hover for information on demand"),
    new TutorialData("#network .zoom-buttons", "Click to zoom in and out. To pan the chart click, hold and move left or right in any blank area")])
}