import d3 from "d3";
import { Help } from "../utils/help.js";
import { IAuthorAnalyticsData, ITags } from "../data/data.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";
import { Network } from "../charts/author/network.js";
import { TimelineNetwork } from "../charts/author/timelineNetwork.js";
import { AuthorAnalyticsDataRaw, IAuthorAnalyticsDataRaw } from "../data/db.js";
import { Reflections } from "../charts/author/reflections.js";
import { groupBy } from "../utils/utils.js";

export class Dashboard {
    timeline: TimelineNetwork<this>
    network: Network<this>
    reflections: Reflections<this>
    constructor(data: IAuthorAnalyticsData) {
        this.resizeTimeline()
        this.timeline = new TimelineNetwork(data.reflections)
        this.network = new Network(data.analytics, data.reflections.map(d => d.timestamp))
        this.reflections = new Reflections(data.reflections)
    }
    resizeTimeline(): void {
        let height = document.querySelector("#reflection-entry").getBoundingClientRect().height
        document.querySelector("#timeline .chart-container").setAttribute("style", `min-height:${height - 80}px`)
    }
    preloadTags(entries: IAuthorAnalyticsData, enable: boolean = false): ITags[] {
        let tags = groupBy(entries.analytics.nodes, "name").map(r => { return {"name": r.key, "properties": r.value[0].properties, "selected": r.value[0].selected}})
        d3.select("#tags").selectAll("li")
            .data(tags)
            .enter()
            .append("li")
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
                .property("disabled", !enable));
        
        return tags
    }
}

export async function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorAnalyticsDataRaw) {
    const loading = new Loading()
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10)
    const entries = new AuthorAnalyticsDataRaw(entriesRaw).transformData(colourScale)
    await drawCharts(entries)
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#network .network-node-group", "Hover for information on demand, zoom is also available")]);
    loading.isLoading = false;
    loading.removeDiv();

    async function drawCharts(data: IAuthorAnalyticsData) {
        const dashboard = new Dashboard(data)
        const help = new Help()
        dashboard.preloadTags(data)

        //Handle timeline chart help
        help.helpPopover(dashboard.network.id, `<b>Network diagram</b><br>
            A network diagram that shows the phrases and tags associated to your reflections<br>The data represented are your <i>reflections over time</i><br>
            Use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move<br>
            <u><i>Hover</i></u> over the network nodes for information on demand`) 

        //Handle timeline chart help
        help.helpPopover(dashboard.timeline.id, `<b>Timeline</b><br>
            Your reflections and the tags associated to them are shown over time<br>
            <u><i>Hover</i></u> over a reflection point for information on demand`)

        //Handle users histogram chart help
        help.helpPopover(dashboard.reflections.id, `<b>Reflections</b><br>
            Your reflections are shown sorted by time. The words with associated tags have a different background colour`)
    }
}