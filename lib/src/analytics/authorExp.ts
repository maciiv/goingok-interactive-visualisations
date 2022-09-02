import d3 from "d3";
import { ChartTimeNetwork, ChartNetwork } from "../charts/charts.js";
import { IAuthorExperimentalInteractions, AuthorExperimentalInteractions } from "../charts/interactions.js";
import { IRelfectionAuthorAnalytics, INetworkData, ITags, IReflectionAnalytics, IReflectionAuthor } from "../data/data.js";
import { AuthorControlCharts, IAuthorControlCharts } from "./authorControl.js";
import { ChartPadding } from "../charts/render.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";

export interface IAuthorExperimentalCharts extends IAuthorControlCharts {
    interactions: IAuthorExperimentalInteractions;
    allEntries: IRelfectionAuthorAnalytics[];
    allNetworkData: INetworkData;
    allTags: ITags[];
    timelineChart: ChartTimeNetwork;
    networkChart: ChartNetwork;
    sorted: string;
    handleTags(): void;
    handleTagsColours(): void;
    handleReflectionsSort(): void;
}

export class AuthorExperimentalCharts extends AuthorControlCharts implements IAuthorExperimentalCharts {
    interactions = new AuthorExperimentalInteractions();
    allEntries: IRelfectionAuthorAnalytics[];
    allNetworkData: INetworkData;
    allTags: ITags[];
    timelineChart: ChartTimeNetwork;
    networkChart: ChartNetwork;
    sorted = "date";

    preloadTags(entries: IRelfectionAuthorAnalytics[], enable?: boolean): ITags[] {
        let tags = super.preloadTags(entries, true);
        this.allEntries = entries;
        this.allTags = tags;

        d3.select("#tags").selectAll<HTMLLIElement, ITags>("li").select("div")
            .insert("div", "input")
            .attr("class", "input-group-prepend")
            .append("div")
            .attr("class", "input-group-text tag-row")
            .append("input")
            .attr("type", "checkbox")
            .attr("value", d => d.tag)
            .attr("checked", true)

        return tags;
    }

    handleTags(): void {
        let _this = this;
        d3.selectAll("#tags input[type=checkbox]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            if (target.checked) {
                _this.allTags.find(d => d.tag == target.value).selected = true;
            } else {
                _this.allTags.find(d => d.tag == target.value).selected = false;
            }

            let entries = _this.getUpdatedEntriesData();
            let networkData = _this.getUpdatedNetworkData();
            _this.networkChart.resetZoomRange();
            _this.renderNetwork(_this.networkChart, networkData);
            _this.renderReflections(entries);
            _this.renderTimeline(_this.timelineChart, entries);
        });
    };

    handleTagsColours(): void {
        const _this = this;
        d3.selectAll("#tags input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let tag = target.id.replace("colour-", "");
            _this.allEntries = _this.allEntries.map(c => { 
                let tags = c.tags.filter(d => d.tag === tag);
                for(var i = 0; i < tags.length; i++) {
                    c.tags.find(d => d === tags[i]).colour = target.value;
                }
                return c
            });
            
            let nodes = _this.allNetworkData.nodes.filter(d => d.tag === tag);
            for(var i = 0; i < nodes.length; i++) {
                nodes[i].colour = target.value;
            }

            let entries = _this.getUpdatedEntriesData();
            let networkData = _this.getUpdatedNetworkData();
            _this.networkChart.resetZoomRange();
            _this.renderNetwork(_this.networkChart, networkData);
            _this.renderReflections(entries);
            _this.renderTimeline(_this.timelineChart, entries);
        });
    };

    handleReflectionsSort(): void {
        const _this = this;
        d3.select("#sort .btn-group-toggle").on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            _this.allEntries = _this.allEntries.sort(function (a, b) {
                if (selectedOption == "date") {
                    return _this.interactions.sort.sortData(a.timestamp, b.timestamp, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "point") {
                    return _this.interactions.sort.sortData(a.point, b.point, _this.sorted == "point" ? true : false);
                }
            });
            _this.sorted = _this.interactions.sort.setSorted(_this.sorted, selectedOption);
            let entries = _this.getUpdatedEntriesData();
            _this.renderReflections(entries);
        });
    };

    handleFilterButton(): void {
        this.interactions.click.removeClick(this.timelineChart);
        let entries = this.getUpdatedEntriesData();
        let networkData = this.getUpdatedNetworkData();
        this.renderNetwork(this.networkChart, networkData);
        this.renderReflections(entries);
        this.renderTimeline(this.timelineChart, entries);
    };

    private getUpdatedEntriesData(): IRelfectionAuthorAnalytics[] {
        const _this = this;
        return _this.allEntries.map(c => { 
            let tags = c.tags.filter(d => _this.allTags.filter(c => c.selected).map(r => r.tag).includes(d.tag));
            return { "timestamp": c.timestamp, "pseudonym": c.pseudonym, "point": c.point, "text": c.text, "tags": tags, "matrix": c.matrix }
        });
    }

    private getUpdatedNetworkData(networkData?: INetworkData): INetworkData {
        const _this = this;
        let data = networkData === undefined ? _this.allNetworkData : networkData;
        let nodes = data.nodes.filter(d => { 
            return _this.allTags.filter(c => c.selected).map(r => r.tag).includes(d.tag) || d.tag === "ref"
        });
        let links = data.links.filter(d => { 
            return (_this.allTags.filter(c => c.selected).map(r => r.tag).includes((d.source as ITags).tag) &&
                _this.allTags.filter(c => c.selected).map(r => r.tag).includes((d.target as ITags).tag)) ||
                ((d.source as ITags).tag === "ref"  && 
                _this.allTags.filter(c => c.selected).map(r => r.tag).includes((d.target as ITags).tag))
        });

        return { "nodes": nodes, "links": links }
    }

    renderTimeline(chart: ChartTimeNetwork, data: IRelfectionAuthorAnalytics[]): ChartTimeNetwork {
        chart = super.renderTimeline(chart, data);    

        const _this = this
        _this.interactions.click.enableClick(chart, onClick);

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            let entries = _this.getUpdatedEntriesData();
            let networkData = _this.getUpdatedNetworkData();
            _this.renderNetwork(_this.networkChart, networkData);
            _this.renderReflections(entries);
        });

        function onClick(e: Event, d: IRelfectionAuthorAnalytics) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                let networkData = _this.getUpdatedNetworkData();
                _this.renderNetwork(_this.networkChart, networkData)
                _this.renderReflections(data);
                return;
            }
            _this.interactions.click.removeClick(chart);
            chart.click = true;
            d3.select(this).classed("clicked", true);
            let nodes = _this.allNetworkData.nodes.filter(c => {
                return filterNodes(d.tags, c) || c.phrase === d.timestamp.toDateString()
            });
            let links = _this.allNetworkData.links.filter(c => {
                return nodes.includes(c.source as ITags) || nodes.includes(c.target as ITags)
            })
            let networkData = _this.getUpdatedNetworkData({"nodes": nodes, "links": links});
            _this.renderNetwork(_this.networkChart, networkData);
            _this.renderReflections([d]);
        }

        function filterNodes(tags: ITags[], tag: ITags) {
            return tags.map(d => d.start_index).includes(tag.start_index) &&
                tags.map(d => d.end_index).includes(tag.end_index) &&
                tags.map(d => d.phrase).includes(tag.phrase)
        }

        return chart;
    }

    renderNetwork(chart: ChartNetwork, data: INetworkData): ChartNetwork {
        chart = super.renderNetwork(chart, data);

        const _this = this;

        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton());

        chart.elements.content
            .call(d3.drag()
                .on("start", dragStart)
                .on("drag", dragging)
                .on("end", dragEnd));

        function dragStart(e: d3.D3DragEvent<SVGGElement, ITags, ITags>) {
            if (!e.active) _this.networkChart.simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
            d3.select(this).attr("transform", `translate(${e.subject.fx}, ${e.subject.fy})`);
        }
          
          function dragging(e: d3.D3DragEvent<SVGGElement, ITags, ITags>) {
            e.subject.fx = e.x;
            e.subject.fy = e.y;
            d3.select(this).attr("transform", `translate(${e.subject.fx}, ${e.subject.fy})`);
        }
          
          function dragEnd(e: d3.D3DragEvent<SVGGElement, ITags, ITags>) {
            if (!e.active) _this.networkChart.simulation.alphaTarget(0);
            e.subject.fx = null;
            e.subject.fy = null;
            d3.select(this).attr("transform", `translate(${e.subject.x}, ${e.subject.y})`);
        }

        return chart
    }

    renderReflections(data: IRelfectionAuthorAnalytics[]): void {
        super.renderReflections(data)

        const _this = this;

        d3.select(`#reflections .badge`).on("click", () => _this.handleFilterButton());
    }
}

export async function buildExperimentAuthorAnalyticsCharts(entriesRaw: IReflectionAuthor[], analyticsRaw: IReflectionAnalytics[]) {
    let loading = new Loading();
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    const entries = d3.sort(entriesRaw.map((d, i) => { return {"timestamp": new Date(d.timestamp), "pseudonym": d.pseudonym, "point": d.point, "text": d.text, "tags": analyticsRaw[i].tags.map(d => processColour(d)), "matrix": analyticsRaw[i].matrix } as IRelfectionAuthorAnalytics }), d => d.timestamp);
    await drawCharts(entries);
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#network .network-node-group", "Hover for information on demand, zoom is also available")]);
    loading.isLoading = false;
    loading.removeDiv();

    function processColour(tag: ITags): ITags {
        if (tag.colour === undefined) {
            return {"start_index": tag.start_index, "tag": tag.tag, "phrase": tag.phrase, "colour": colourScale(tag.tag), "end_index": tag.end_index}
        }
        return tag;
    }

    async function drawCharts(entries: IRelfectionAuthorAnalytics[]) {
        let authorExperimentalCharts = new AuthorExperimentalCharts();
        authorExperimentalCharts.resizeTimeline()
        authorExperimentalCharts.preloadTags(entries, true)

        authorExperimentalCharts.networkChart = new ChartNetwork("network", "chart-container.network", entries.map(d => d.timestamp));
        authorExperimentalCharts.allNetworkData = authorExperimentalCharts.processNetworkData(authorExperimentalCharts.networkChart, entries);
        authorExperimentalCharts.networkChart.simulation = authorExperimentalCharts.processSimulation(authorExperimentalCharts.networkChart, authorExperimentalCharts.allNetworkData);
        authorExperimentalCharts.renderNetwork(authorExperimentalCharts.networkChart, authorExperimentalCharts.allNetworkData);

        //Handle timeline chart help
        d3.select("#network .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select("#network .zoom-rect.active"), `${authorExperimentalCharts.networkChart.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                authorExperimentalCharts.help.helpPopover(d3.select(this), `${authorExperimentalCharts.networkChart.id}-help`, "<b>Network diagram</b><br>A network diagram that shows the phrases and tags associated to your reflections<br>The data represented are your <i>reflections over time</i>");
                let showDataHelp = authorExperimentalCharts.help.helpPopover(authorExperimentalCharts.networkChart.elements.contentContainer.select(".network-node-group"), `${authorExperimentalCharts.networkChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>drag</i></u> me to rearrange the network");
                if (showDataHelp) {
                    d3.select(`#${authorExperimentalCharts.networkChart.id}-help-data`).style("top", parseInt(d3.select(`#${authorExperimentalCharts.networkChart.id}-help-data`).style("top")) - 14 + "px");
                }
            });

        authorExperimentalCharts.timelineChart = new ChartTimeNetwork("timeline", entries.map(d => d.timestamp), new ChartPadding(40, 75, 10, 10));
        entries.forEach(c => authorExperimentalCharts.processTimelineSimulation(authorExperimentalCharts.timelineChart, authorExperimentalCharts.timelineChart.x.scale(c.timestamp), authorExperimentalCharts.timelineChart.y.scale(c.point), c.tags));
        authorExperimentalCharts.renderTimeline(authorExperimentalCharts.timelineChart, entries);

        //Handle timeline chart help
        d3.select("#timeline .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Timeline</b><br>Your reflections and the tags associated to them are shown over time");
                authorExperimentalCharts.help.helpPopover(authorExperimentalCharts.timelineChart.elements.contentContainer.select(".point"), `${authorExperimentalCharts.timelineChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

        authorExperimentalCharts.renderReflections(entries);

        //Handle users histogram chart help
        d3.select("#reflections .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Reflections</b><br>Your reflections are shown sorted by time. The words with associated tags have a different background colour");
            });

        authorExperimentalCharts.handleTags();
        authorExperimentalCharts.handleTagsColours();
        authorExperimentalCharts.handleReflectionsSort();
    }
}