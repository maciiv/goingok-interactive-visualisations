import { scaleOrdinal, schemeCategory10, select } from "d3";
import { AuthorAnalytics, IAuthorAnalyticsData, IEdges, INodes, ITags } from "../data/data";
import { Tutorial, TutorialData } from "../utils/tutorial";
import { Network } from "../charts/author/network";
import { AuthorAnalyticsDataRaw, IAuthorAnalyticsEntriesRaw, IAuthorEntriesRaw } from "../data/db";
import { Reflections } from "../charts/author/reflections";
import { groupBy } from "../utils/utils";
import { ChartHelp } from "../charts/chartBase";

export class Dashboard {
    network: Network
    reflections: Reflections
    constructor(entriesRaw: IAuthorEntriesRaw[], analyticsRaw?: IAuthorAnalyticsEntriesRaw[]) {
        try {
            const colourScale = scaleOrdinal(schemeCategory10)
            const data = entriesRaw.map(d => new AuthorAnalyticsDataRaw(d.reflections, d.pseudonym, analyticsRaw?.find(c => c.pseudonym == d.pseudonym)).transformData(colourScale))
            try {
                this.network = new Network(new AuthorAnalytics(data[0].reflections, data[0].analytics.nodes, data[0].analytics.edges as IEdges<INodes>[]), data[0].reflections.map(d => d.timestamp))
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
        console.error(e)
        select(`#${chartId} ${css === undefined ? ".chart-container" : css}`)
            .text(`There was an error rendering the chart. ${e}`)
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
                        try {
                            this.reflections.data = d.reflections
                        } catch (e) {
                            this.renderError(e, "reflections")
                        }
                        try {
                            this.network.data = d.analytics
                        } catch (e) {
                            this.renderError(e, "network")
                        }
                        
                    } else {
                        extend(e, d)
                    }
                    
                    select(".multi-user button")
                        .text(d.pseudonym)
                })
        }
    }
    preloadTags(entries: IAuthorAnalyticsData, enable: boolean = false): ITags[] {
        const tags = groupBy(entries.analytics.nodes, "nodeCode").map(r => 
            { 
                return {
                    "key": r.key, 
                    "name": r.value[0].name !== null ? r.value[0].name : r.key, 
                    "properties": r.value[0].properties, 
                    "selected": r.value[0].selected, 
                    "description": r.value[0].description
                } as ITags
            })
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
                            .attr("id", d => `tag-${d.key}`)
                            .attr("type", "checkbox")
                            .attr("value", d => d.key)
                            .property("checked", true) :  null)
                        .call(div => div.append("label")
                            .attr("class", "tag-check-label")
                            .attr("for", d => `tag-${d.key}`)
                            .text(d => d.name)))
                    .call(div => div.append("button")
                        .attr("class", "badge rounded-pill bg-secondary tag-help")
                        .on("click", function(e: Event, d: ITags) {
                            const popover = select(`#${d.key}-help`)
                            const icon = select(this).select("i")
                            if (popover.empty()) {
                                select("body").append("div")
                                    .attr("id", `${d.key}-help`)
                                    .attr("class", "popover fade show")
                                    .style("top", `${window.pageYOffset + this.getBoundingClientRect().top + this.getBoundingClientRect().height}px`)
                                    .call(div => div.append("div")
                                        .attr("class", "popover-body")
                                        .text(d.description))
                                    .call(div => div.style("left", `${this.getBoundingClientRect().left - (div.node().getBoundingClientRect().width / 2)}px`))
                                icon?.attr("class", "fas fa-times")
                            } else {
                                popover.remove()
                                icon?.attr("class", "fas fa-info")
                            }
                        })
                        .append("i")
                        .attr("class", "fas fa-info"))
                    .call(div => div.append("input")
                        .attr("class", "tag-color-picker")
                        .attr("id", d => `colour-${d.key}`)
                        .attr("type", "color")
                        .attr("value", d => d.properties["color"])
                        .property("disabled", !enable)),
                update => update.call(update => update.select("div label")
                    .text(d => d.name))
                    .call(update => update.select(".tag-color-picker")
                        .attr("value", d => d.properties["color"])),
                exit => exit.remove()
            )
        return tags
    }
}

export function buildControlAuthorAnalyticsCharts(entriesRaw: IAuthorEntriesRaw[], analyticsRaw?: IAuthorAnalyticsEntriesRaw[]) {
    const dashboard = new Dashboard(entriesRaw, analyticsRaw)

    //Handle timeline chart help
    dashboard.network.help.helpPopover(`<b>Network diagram</b><br>
        A network diagram that shows the phrases and tags associated to your reflections<br>
        The data represented are your <i>reflections over time</i><br>
        <u><i>Hover</i></u> over the network nodes for information on demand`) 

    //Handle users histogram chart help
    dashboard.reflections.help.helpPopover(`<b>Reflections</b><br>
        Your reflections are shown sorted by time. The words with associated tags have a different outline colour`)
    
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle-ref", "Hover for information on demand"),
    new TutorialData("#reflections .reflection-text span", "Phrases outlined with a colour that matches the tags"),
    new TutorialData("#network .network-node-group", "Hover for information on demand"),
    new TutorialData("#network .zoom-buttons", "Click to zoom in and out. To pan the chart click, hold and move left or right in any blank area")])
}