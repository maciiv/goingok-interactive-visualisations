import d3 from "d3";
import { IAnalytics, IEdges, INodes } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Zoom } from "../../interactions/zoom.js";
import { addDays, maxDate, minDate } from "../../utils/utils.js";
import { ChartNetwork, ExtendChart } from "../chartBase.js";
import { Help } from "../../utils/help.js";

// Basic class for network chart timeline
export class Network<T> extends ChartNetwork {
    tooltip = new Tooltip(this)
    zoom = new Zoom(this)
    help = new Help()
    clicking = new Click(this)
    simulation: d3.Simulation<INodes, undefined>
    dashboard?: T
    extend?: ExtendChart<T>
    private _data: IAnalytics
    get data() {
        return this._data
    }
    set data(entries: IAnalytics) {
        this._data = this.filterData(entries)
        this.resetZoomRange()
        this.render()
        this.extend !== undefined && this.dashboard !== undefined ? this.extend(this.dashboard) : null
    }
    constructor(data: IAnalytics, domain: Date[]) {
        super("network", "chart-container.network", [addDays(minDate(domain), -30), addDays(maxDate(domain), 30)])
        this.simulation = this.processSimulation(data)
        this.data = data
    }
    render() {
        const _this = this

        let edges = _this.elements.contentContainer.selectAll(".network-link")
            .data(_this.data.edges)
            .join(
                enter => enter.append("line")
                    .attr("class", "network-link")
                    .classed("reflection-link", d => d.isReflection)
                    .attr("x1", _this.width / 2)
                    .attr("y1", _this.height / 2)
                    .attr("x2", _this.width / 2)
                    .attr("y2", _this.height / 2)
                    .call(enter => enter.transition()
                    .duration(750)
                    .attr("x1", d => (d.source as INodes).x)
                    .attr("y1", d => (d.source as INodes).y)
                    .attr("x2", d => (d.target as INodes).x)
                    .attr("y2", d => (d.target as INodes).y)),
                update => update.call(update => update.transition()
                    .duration(750)               
                    .attr("x1", d => (d.source as INodes).x)
                    .attr("y1", d => (d.source as INodes).y)
                    .attr("x2", d => (d.target as INodes).x)
                    .attr("y2", d => (d.target as INodes).y)),
                exit => exit.remove()
            );
        
        let nodes = _this.elements.content = _this.elements.contentContainer.selectAll(".network-node-group")
            .data(_this.data.nodes)
            .join(
                enter => enter.append("g")
                    .attr("class", "network-node-group")
                    .attr("transform", `translate(${_this.width / 2}, ${_this.height / 2})`)
                    .call(enter => enter.append("rect")
                        .attr("class", "network-node")
                        .style("fill", d => d.properties["color"])
                        .style("stroke", d => d.properties["color"]))
                    .call(enter => enter.append("text")
                        .attr("id", d => `text-${d.idx}`)
                        .attr("class", "network-text"))
                    .call(enter => enter.select("rect")
                        .attr("x", -5)
                        .attr("y", -5)
                        .attr("width", 10)
                        .attr("height", 10))
                    .call(enter => enter.transition()
                        .duration(750)
                        .attr("transform", d => `translate(${d.x}, ${d.y})`)),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", d => `translate(${d.x}, ${d.y})`))
                    .call(update => update.select("rect")
                        .style("fill", d => d.properties["color"])
                        .style("stroke", d => d.properties["color"]))
                    .call(update => update.select("text")
                        .attr("id", d => `text-${d.idx}`)),
                exit => exit.remove()
            );
        
        _this.elements.content = _this.elements.contentContainer.selectAll(".network-node-group");

        _this.simulation.on("tick", ticked);

        function ticked() {
            edges.attr("x1", d => (d.source as INodes).x)
            .attr("y1", d => (d.source as INodes).y)
            .attr("x2", d => (d.target as INodes).x)
            .attr("y2", d => (d.target as INodes).y)

            nodes.attr("transform", (d: INodes) => `translate(${d.x}, ${d.y})`)
        }

        //Enable tooltip       
        _this.tooltip.enableTooltip(onMouseover, onMouseout);
        function onMouseover(e: Event, d: INodes) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }

            d3.selectAll<SVGGElement, INodes>(".network-node-group")
                .filter(c => _this.getTooltipNodes(_this.data, d).includes(c))
                .call(enter => enter.select("text")
                    .text(d => d.expression)
                    .style("opacity", 0)
                    .transition()
                    .duration(500)
                    .style("opacity", "1"))
                .call(enter => enter.select(".network-node")
                    .transition()
                    .duration(500)
                    .attr("x", d => -(enter.select<SVGTextElement>(`#text-${d.idx}`).node().getBoundingClientRect().width + 10) / 2)
                    .attr("y", d => -(enter.select<SVGTextElement>(`#text-${d.idx}`).node().getBoundingClientRect().height + 5) / 2)
                    .attr("width", d => enter.select<SVGTextElement>(`#text-${d.idx}`).node().getBoundingClientRect().width + 10)
                    .attr("height", d => enter.select<SVGTextElement>(`#text-${d.idx}`).node().getBoundingClientRect().height + 5))
        }

        function onMouseout() {
            d3.selectAll<SVGGElement, INodes>(".network-node-group")
                .call(enter => enter.select("text")
                    .text(null)
                    .style("opacity", 0)
                    .transition()
                    .duration(500)
                    .style("opacity", "1"))
                .call(enter => enter.select(".network-node")
                    .transition()
                    .duration(500)
                    .attr("x", -5)
                    .attr("y", -5)
                    .attr("width", 10)
                    .attr("height", 10))
            
            d3.selectAll<HTMLSpanElement, unknown>("#reflections .reflections-tab span")
                .style("background-color", null)
            
            _this.tooltip.removeTooltip();
        }

        //Enable zoom
        _this.zoom.enableZoom(zoomed);
        function zoomed(e: d3.D3ZoomEvent<SVGRectElement, unknown>) {
            let newChartRange = [0, _this.width - _this.padding.yAxis - _this.padding.right].map(d => e.transform.applyX(d));
            _this.x.scale.rangeRound(newChartRange);

            _this.elements.contentContainer.selectAll<SVGLineElement, any>(".network-link")
                .attr("x1", d => e.transform.applyX(d.source.x))
                .attr("x2", d => e.transform.applyX(d.target.x));

            _this.elements.contentContainer.selectAll<SVGGElement, INodes>(".network-node-group")
                .attr("transform", (d, i, g) => `translate(${e.transform.applyX(d.x)}, ${d.y})`);

            _this.x.axis.ticks(newChartRange[1] / 75);
            _this.elements.xAxis.call(_this.x.axis);
            _this.help.removeHelp(_this);
        }
    }
    resetZoomRange(): void {
        this.x.scale.range([0, this.width - this.padding.yAxis - this.padding.right]);
        d3.zoom().transform(this.elements.contentContainer.select(".zoom-rect"), d3.zoomIdentity);
        this.x.axis.ticks((this.width - this.padding.yAxis - this.padding.right) / 75);
        this.elements.xAxis.transition().duration(750).call(this.x.axis);
    }
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[] {
        let edges = data.edges.filter(d => d.source === nodeData).map(d => d.target as INodes);
        edges = edges.concat(data.edges.filter(d => d.target === nodeData).map(d => d.source as INodes));
        edges.push(nodeData);
        return edges;
    }
    private processSimulation(data: IAnalytics): d3.Simulation<INodes, undefined> {
        return d3.forceSimulation<INodes, undefined>(data.nodes)
            .force("link", d3.forceLink<INodes, IEdges<INodes>>()
                .id(d => d.idx)
                .distance(100)
                .links(data.edges))
            .force("charge", d3.forceManyBody().strength(-25))
            .force("collide", d3.forceCollide().radius(30).iterations(5))
            .force("center", d3.forceCenter((this.width -this.padding.yAxis - this.padding.right - 10) / 2, (this.height - this.padding.top - this.padding.xAxis + 5) / 2));
    }
    private filterData(data: IAnalytics): IAnalytics {
        let nodes = data.nodes.filter(d => d.selected)
        let edges = data.edges.filter(d => (d.source as INodes).selected && (d.target as INodes).selected)
        return { "name": data.name, "description": data.description, "nodes": nodes, "edges": edges }
    }
}