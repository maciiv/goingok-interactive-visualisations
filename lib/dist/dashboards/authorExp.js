var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
;
import { Dashboard } from "./authorControl.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";
import { AuthorAnalyticsDataRaw } from "../data/db.js";
import { Help } from "../utils/help.js";
import { Sort } from "../interactions/sort.js";
export class ExperimentalDashboard extends Dashboard {
    constructor(data) {
        super(data);
        this.sorted = "";
        this.sort = new Sort();
        this.help = new Help();
        this.timeline.extend = this.extendTimeline;
        this.timeline.dashboard = this;
        this.extendTimeline(this);
        this.network.extend = this.extendNetwork;
        this.network.dashboard = this;
        this.extendNetwork(this);
        this.reflections.extend = this.extendReflections;
        this.reflections.dashboard = this;
        this.extendReflections(this);
    }
    preloadTags(entries) {
        this.tags = super.preloadTags(entries, true);
        this.reflectionAnalytics = entries.reflections;
        this.analytics = entries.analytics;
        d3.select("#tags").selectAll("li").select("div")
            .insert("div", "input")
            .attr("class", "input-group-prepend")
            .append("div")
            .attr("class", "input-group-text tag-row")
            .append("input")
            .attr("type", "checkbox")
            .attr("value", d => d.name)
            .property("checked", true);
        return this.tags.filter(c => c.selected);
    }
    handleTags() {
        const _this = this;
        d3.selectAll("#tags input[type=checkbox]").on("change", (e) => {
            const target = e.target;
            if (target.checked) {
                _this.tags.find(c => c.name === target.value).selected = true;
            }
            else {
                _this.tags.find(c => c.name === target.value).selected = false;
            }
            const reflectionsData = _this.updateReflectionNodesData();
            _this.timeline.data = reflectionsData;
            _this.reflections.data = reflectionsData;
            _this.network.data = _this.updateAnalyticsData();
        });
    }
    handleTagsColours() {
        const _this = this;
        d3.selectAll("#tags input[type=color]").on("change", (e) => {
            const target = e.target;
            const name = target.id.replace("colour-", "");
            _this.tags.find(c => c.name === name).properties["color"] = target.value;
            const reflectionsData = _this.updateReflectionNodesData();
            _this.timeline.data = reflectionsData;
            _this.reflections.data = reflectionsData;
            _this.network.data = _this.updateAnalyticsData();
        });
    }
    extendTimeline(dashboard) {
        const _this = dashboard;
        const chart = _this.timeline;
        chart.clicking.enableClick(onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick();
            _this.network.data = _this.updateAnalyticsData();
            _this.reflections.data = _this.updateReflectionNodesData();
        });
        function onClick(e, d) {
            if (d3.select(this).attr("class").includes("clicked")) {
                chart.clicking.removeClick();
                _this.network.data = _this.updateAnalyticsData();
                _this.reflections.data = _this.updateReflectionNodesData();
                return;
            }
            chart.clicking.removeClick();
            chart.click = true;
            d3.select(this).classed("clicked", true);
            let nodes = _this.analytics.nodes.filter(c => {
                return d.refId === c.refId || c.name === d.timestamp.toDateString();
            });
            let edges = _this.analytics.edges.filter(c => {
                return nodes.includes(c.source) || nodes.includes(c.target);
            });
            _this.network.data = { "name": _this.analytics.name, "description": _this.analytics.description, "nodes": nodes, "edges": edges };
            _this.reflections.data = [d];
        }
    }
    extendNetwork(dashboard) {
        const _this = dashboard;
        const chart = _this.network;
        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton());
        chart.clicking.enableClick(onClick);
        function onClick(e, d) {
            let nodes = chart.getTooltipNodes(_this.analytics, d);
            d3.selectAll("#reflections .reflections-tab div")
                .filter(c => c.refId === d.refId)
                .selectAll("span")
                .each((c, i, g) => {
                let node = nodes.find(r => r.idx === parseInt(d3.select(g[i]).attr("id").replace("node-", "")));
                if (node !== undefined) {
                    d3.select(g[i]).style("background-color", node.properties["color"]);
                }
            });
            document.querySelector(`#ref-${d.refId}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        chart.elements.content
            .call(d3.drag()
            .on("start", dragStart)
            .on("drag", dragging)
            .on("end", dragEnd));
        function dragStart(e) {
            if (!e.active)
                chart.simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
            d3.select(this).attr("transform", `translate(${e.subject.fx}, ${e.subject.fy})`);
        }
        function dragging(e) {
            e.subject.fx = e.x;
            e.subject.fy = e.y;
            d3.select(this).attr("transform", `translate(${e.subject.fx}, ${e.subject.fy})`);
        }
        function dragEnd(e) {
            if (!e.active)
                chart.simulation.alphaTarget(0);
            e.subject.fx = null;
            e.subject.fy = null;
            d3.select(this).attr("transform", `translate(${e.subject.x}, ${e.subject.y})`);
        }
        return chart;
    }
    extendReflections(dashboard) {
        const _this = dashboard;
        d3.select(`#reflections .badge`).on("click", () => _this.handleFilterButton());
    }
    handleFilterButton() {
        this.timeline.clicking.removeClick();
        const reflectionsData = this.updateReflectionNodesData();
        this.timeline.data = reflectionsData;
        this.reflections.data = reflectionsData;
        this.network.data = this.updateAnalyticsData();
    }
    ;
    updateReflectionNodesData() {
        return this.reflectionAnalytics.map(c => {
            c.nodes = c.nodes.map(r => {
                let tag = this.tags.find(d => d.name === r.name);
                r.selected = tag.selected;
                r.properties["color"] = tag.properties["color"];
                return r;
            });
            return { "refId": c.refId, "point": c.point, "text": c.text, "timestamp": c.timestamp, "nodes": c.nodes };
        });
    }
    updateAnalyticsData() {
        let nodes = this.analytics.nodes.map(c => {
            let tag = this.tags.find(d => d.name === c.name);
            c.selected = tag.selected;
            c.properties["color"] = tag.properties["color"];
            return c;
        });
        let edges = this.analytics.edges.map(c => {
            c.source.selected = this.tags.find(d => d.name === c.source.name).selected;
            c.target.selected = this.tags.find(d => d.name === c.target.name).selected;
            return c;
        });
        return { "name": this.analytics.name, "description": this.analytics.description, "nodes": nodes, "edges": edges };
    }
}
export function buildExperimentAuthorAnalyticsCharts(entriesRaw) {
    return __awaiter(this, void 0, void 0, function* () {
        const loading = new Loading();
        const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
        const entries = new AuthorAnalyticsDataRaw(entriesRaw).transformData(colourScale);
        yield drawCharts(entries);
        new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
            new TutorialData("#timeline .circle", "Hover for information on demand"),
            new TutorialData("#network .network-node-group", "Hover for information on demand, zoom is also available")]);
        loading.isLoading = false;
        loading.removeDiv();
        function drawCharts(data) {
            return __awaiter(this, void 0, void 0, function* () {
                const dashboard = new ExperimentalDashboard(data);
                const help = new Help();
                dashboard.preloadTags(data);
                //Handle timeline chart help
                help.helpPopover(dashboard.network.id, `<b>Network diagram</b><br>
            A network diagram that shows the phrases and tags associated to your reflections<br>The data represented are your <i>reflections over time</i><br>
            Use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move<br>
            <u><i>Hover</i></u> over the network nodes for information on demand<br>
            <u><i>Drag</i></u> the network nodes to rearrange the network<br>
            <u><i>Click</i></u> to highlight the nodes in the reflection text`);
                //Handle timeline chart help
                help.helpPopover(dashboard.timeline.id, `<b>Timeline</b><br>
            Your reflections and the tags associated to them are shown over time<br>
            <u><i>Hover</i></u> over a reflection point for information on demand<br>
            <u><i>Click</i></u> a reflection point to filter the network diagram`);
                //Handle reflections chart help
                help.helpPopover(dashboard.reflections.id, `<b>Reflections</b><br>
            Your reflections are shown sorted by time. The words with associated tags have a different background colour`);
                dashboard.handleTags();
                dashboard.handleTagsColours();
            });
        }
    });
}
