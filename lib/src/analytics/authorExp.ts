import d3 from "d3";
import { ChartTimeNetwork, ChartNetwork } from "../charts/charts.js";
import { IAuthorExperimentalInteractions, AuthorExperimentalInteractions } from "../charts/interactions.js";
import { IReflectionAnalytics, IReflection, INodes } from "../data/data.js";
import { AuthorControlCharts, IAuthorControlCharts } from "./authorControl.js";
import { ChartPadding } from "../charts/render.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";

export interface IAuthorExperimentalCharts extends IAuthorControlCharts {
    interactions: IAuthorExperimentalInteractions;
    allAnalytics: IReflectionAnalytics[];
    timelineChart: ChartTimeNetwork;
    networkChart: ChartNetwork;
    sorted: string;
    handleTags(): void;
    handleTagsColours(): void;
    handleReflectionsSort(): void;
}

export class AuthorExperimentalCharts extends AuthorControlCharts implements IAuthorExperimentalCharts {
    interactions = new AuthorExperimentalInteractions();
    allAnalytics: IReflectionAnalytics[];
    timelineChart: ChartTimeNetwork;
    networkChart: ChartNetwork;
    sorted = "date";

    preloadTags(entries: IReflectionAnalytics[], enable?: boolean): INodes[] {
        let nodes = super.preloadTags(entries, true);
        this.allAnalytics = entries

        d3.select("#tags").selectAll<HTMLLIElement, INodes>("li").select("div")
            .insert("div", "input")
            .attr("class", "input-group-prepend")
            .append("div")
            .attr("class", "input-group-text tag-row")
            .append("input")
            .attr("type", "checkbox")
            .attr("value", d => d.name)
            .attr("checked", true)

        return nodes;
    }

    handleTags(): void {
        let _this = this;
        d3.selectAll("#tags input[type=checkbox]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            if (target.checked) {
                _this.allNodes.filter(d => d.name == target.value).forEach(c => c.selected = true)
            } else {
                _this.allNodes.filter(d => d.name == target.value).forEach(c => c.selected = false)
            }

            let analytics = _this.getUpdatedAnalyticsData();
            let networkData = _this.getUpdatedNetworkData();
            _this.networkChart.resetZoomRange();
            _this.renderNetwork(_this.networkChart, networkData);
            _this.renderReflections(_this.allEntries);
            _this.renderTimeline(_this.timelineChart, _this.allEntries, analytics.find(d => d.name == "Your Timeline"));
        });
    };

    handleTagsColours(): void {
        const _this = this;
        d3.selectAll("#tags input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let name = target.id.replace("colour-", "");
            _this.allAnalytics = _this.allAnalytics.map(c => { 
                let nodes = c.nodes.filter(d => d.name === name);
                for(var i = 0; i < nodes.length; i++) {
                    c.nodes.find(d => d === nodes[i]).properties["color"] = target.value;
                }
                return c
            });

            let analytics = _this.getUpdatedAnalyticsData();
            _this.networkChart.resetZoomRange();
            _this.renderNetwork(_this.networkChart, analytics.find(d => d.name == "Your Network"));
            _this.renderReflections(_this.allEntries);
            _this.renderTimeline(_this.timelineChart, _this.allEntries, analytics.find(d => d.name == "Your Timeline"));
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
            _this.renderReflections(_this.allEntries);
        });
    };

    handleFilterButton(): void {
        this.interactions.click.removeClick(this.timelineChart);
        let analytics = this.getUpdatedAnalyticsData();
        this.renderNetwork(this.networkChart, analytics.find(d => d.name == "Your Network"));
        this.renderReflections(this.allEntries);
        this.renderTimeline(this.timelineChart, this.allEntries, analytics.find(d => d.name == "Your Timeline"));
    };

    private getUpdatedAnalyticsData(): IReflectionAnalytics[] {
        const _this = this;
        return _this.allAnalytics.map(c => { 
            let nodes = c.nodes.filter(d => _this.allNodes.filter(c => c.selected).map(r => r.name).includes(d.name));
            return { "name": c.name, "description": c.description, "nodes": nodes, "edges": c.edges }
        });
    }

    private getUpdatedNetworkData(analytics?: IReflectionAnalytics): IReflectionAnalytics {
        const _this = this;
        let data = analytics === undefined ? _this.allAnalytics.find(d => d.name == "Your Network") : analytics;
        let nodes = data.nodes.filter(d => { 
            return _this.allNodes.filter(c => c.selected).map(r => r.name).includes(d.name) || d.name === "ref"
        });
        let edges = data.edges.filter(d => { 
            return (_this.allNodes.filter(c => c.selected).map(r => r.name).includes((d.source as INodes).name) &&
                _this.allNodes.filter(c => c.selected).map(r => r.name).includes((d.target as INodes).name)) ||
                ((d.source as INodes).name === "ref"  && 
                _this.allNodes.filter(c => c.selected).map(r => r.name).includes((d.target as INodes).name))
        });

        return { "name": data.name, "description": data.description, "nodes": nodes, "edges": edges }
    }

    renderTimeline(chart: ChartTimeNetwork, data: IReflection[], analytics: IReflectionAnalytics): ChartTimeNetwork {
        chart = super.renderTimeline(chart, data, analytics);    

        const _this = this
        _this.interactions.click.enableClick(chart, onClick);

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            let analytics = _this.getUpdatedAnalyticsData();
            _this.renderNetwork(_this.networkChart, analytics.find(d => d.name == "Your Network"));
            _this.renderReflections(_this.allEntries);
        });

        function onClick(e: Event, d: IReflection) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                _this.renderNetwork(_this.networkChart, _this.allAnalytics.find(c => c.name == "Your Network"))
                _this.renderReflections(data);
                return;
            }
            _this.interactions.click.removeClick(chart);
            chart.click = true;
            d3.select(this).classed("clicked", true);
            let nodes = _this.allAnalytics.find(c => c.name == "Your Network").nodes.filter(c => {
                return d.refId === c.refId || c.name === d.timestamp.toDateString()
            });
            let edges = _this.allAnalytics.find(c => c.name == "Your Network").edges.filter(c => {
                return nodes.includes(c.source as INodes) || nodes.includes(c.target as INodes)
            })
            let networkData = _this.getUpdatedNetworkData({"name": _this.allAnalytics.find(c => c.name == "Your Network").name, "description": _this.allAnalytics.find(c => c.name == "Your Network").description, "nodes": nodes, "edges": edges});
            _this.renderNetwork(_this.networkChart, networkData);
            _this.renderReflections([d]);
        }

        return chart;
    }

    renderNetwork(chart: ChartNetwork, data: IReflectionAnalytics): ChartNetwork {
        chart = super.renderNetwork(chart, data);

        const _this = this;

        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton());

        chart.elements.content
            .call(d3.drag()
                .on("start", dragStart)
                .on("drag", dragging)
                .on("end", dragEnd));

        function dragStart(e: d3.D3DragEvent<SVGGElement, INodes, INodes>) {
            if (!e.active) _this.networkChart.simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
            d3.select(this).attr("transform", `translate(${e.subject.fx}, ${e.subject.fy})`);
        }
          
          function dragging(e: d3.D3DragEvent<SVGGElement, INodes, INodes>) {
            e.subject.fx = e.x;
            e.subject.fy = e.y;
            d3.select(this).attr("transform", `translate(${e.subject.fx}, ${e.subject.fy})`);
        }
          
          function dragEnd(e: d3.D3DragEvent<SVGGElement, INodes, INodes>) {
            if (!e.active) _this.networkChart.simulation.alphaTarget(0);
            e.subject.fx = null;
            e.subject.fy = null;
            d3.select(this).attr("transform", `translate(${e.subject.x}, ${e.subject.y})`);
        }

        return chart
    }

    renderReflections(data: IReflection[]): void {
        super.renderReflections(data)

        const _this = this;

        d3.select(`#reflections .badge`).on("click", () => _this.handleFilterButton());
    }
}

export async function buildExperimentAuthorAnalyticsCharts(entriesRaw: IReflection[], analyticsRaw: IReflectionAnalytics[]) {
    let loading = new Loading();
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    const entries = d3.sort(entriesRaw.map(d => { return { "refId": d.refId, "timestamp": new Date(d.timestamp), "point": d.point, "text": d.text } as IReflection }), d => d.timestamp);
    const analytics = analyticsRaw.map(d => { return {"name": d.name, "description": d.description, "nodes": d.nodes.map(c => processColour(c)), "edges": d.edges } })
    await drawCharts(entries, analytics);
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#network .network-node-group", "Hover for information on demand, zoom is also available")]);
    loading.isLoading = false;
    loading.removeDiv();

    function processColour(node: INodes): INodes {
        if (node.properties["color"] === undefined) {
            node.properties = {"color": colourScale(node.name)}
        }
        return node;
    }

    async function drawCharts(entries: IReflection[], analytics: IReflectionAnalytics[]) {
        const authorExperimentalCharts = new AuthorExperimentalCharts();
        authorExperimentalCharts.resizeTimeline()
        authorExperimentalCharts.preloadTags(analytics, true)
        authorExperimentalCharts.allEntries = entries

        if (analytics.find(d => d.name == "Your Network") === undefined) {
            d3.select("#network .chart-container.network").html("Chart not found  <br> Interactions won't work")
        } else {
            authorExperimentalCharts.networkChart = new ChartNetwork("network", "chart-container.network", entries.map(d => d.timestamp));
            authorExperimentalCharts.networkChart.simulation = authorExperimentalCharts.processSimulation(authorExperimentalCharts.networkChart, authorExperimentalCharts.allAnalytics.find(d => d.name == "Your Network"));
            authorExperimentalCharts.renderNetwork(authorExperimentalCharts.networkChart, authorExperimentalCharts.allAnalytics.find(d => d.name == "Your Network"));
    
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
        }

        if (analytics.find(d => d.name == "Your Timeline") === undefined) {
            d3.select("#timeline .chart-container").html("Chart not found <br> Interactions won't work")
        } else {
            authorExperimentalCharts.timelineChart = new ChartTimeNetwork("timeline", entries.map(d => d.timestamp), new ChartPadding(40, 75, 10, 10));
            entries.forEach(c => authorExperimentalCharts.processTimelineSimulation(authorExperimentalCharts.timelineChart, authorExperimentalCharts.timelineChart.x.scale(c.timestamp), authorExperimentalCharts.timelineChart.y.scale(c.point), authorExperimentalCharts.allNodes.filter(d => d.refId == c.refId)));
            authorExperimentalCharts.renderTimeline(authorExperimentalCharts.timelineChart, authorExperimentalCharts.allEntries, authorExperimentalCharts.allAnalytics.find(d => d.name == "Your Timeline"));
    
            //Handle timeline chart help
            d3.select("#timeline .card-title button")
                .on("click", function (e: Event) {
                    authorExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Timeline</b><br>Your reflections and the tags associated to them are shown over time");
                    authorExperimentalCharts.help.helpPopover(authorExperimentalCharts.timelineChart.elements.contentContainer.select(".point"), `${authorExperimentalCharts.timelineChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
                });
        }

        authorExperimentalCharts.renderReflections(entries);

        //Handle reflections chart help
        d3.select("#reflections .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Reflections</b><br>Your reflections are shown sorted by time. The words with associated tags have a different background colour");
            });

        if (analytics.find(d => d.name == "Your Network") !== undefined && analytics.find(d => d.name == "Your Timeline") !== undefined) {
            authorExperimentalCharts.handleTags();
            authorExperimentalCharts.handleTagsColours();
            authorExperimentalCharts.handleReflectionsSort();
        }      
    }
}