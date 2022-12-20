import { select, selectAll, forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter, forceY } from "d3";
import { IAnalytics, IEdges, INodes } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { Zoom } from "../../interactions/zoom";
import { addDays, groupBy, maxDate, minDate } from "../../utils/utils";
import { ChartNetwork } from "../chartBase";
import { Help } from "../../utils/help";

interface INodesGroupBy<T extends d3.SimulationNodeDatum, R extends d3.SimulationLinkDatum<T>> extends d3.SimulationNodeDatum {
    key: "refId" | "nodeCode",
    nodes: T[]
    edges: R[]
}

export class Network extends ChartNetwork {
    tooltip = new Tooltip(this)
    zoom = new Zoom(this)
    help = new Help()
    groupByKey = "refId"
    clicking: ClickNetwork<this>
    groupBySimulation: d3.Simulation<INodesGroupBy<INodes, IEdges<INodes>> , undefined>
    simulation: d3.Simulation<INodes, undefined>
    extend?: Function
    networkData: INodesGroupBy<INodes, IEdges<INodes>>[]
    private _data: IAnalytics
    get data() {
        return this._data
    }
    set data(entries: IAnalytics) {
        (async () => {
            this.loading.isLoading = true
            this._data = this.filterData(entries)
            this.processData()
            if (this.networkData.some(c => c.index === undefined)) this.processGroupBySimulation()
            this.zoom.resetZoom()
            try {
                await this.render()
            } catch (e) {
                this.renderError(e)
            }
            this.extend !== undefined ? this.extend() : null
            this.loading.isLoading = false
        })()
        
    }
    constructor(data: IAnalytics, domain: Date[]) {
        super("network", "chart-container.network", [addDays(minDate(domain), -30), addDays(maxDate(domain), 30)])
        this.data = data
        this.clicking = new ClickNetwork(this)
    }
    async render() {
        const _this = this

        _this.elements.contentContainer.selectAll(".network-groupby")
            .data(_this.networkData)
            .join(
                enter => enter.append("circle")
                    .attr("class", "network-groupby")
                    .attr("r", 10)
                    .call(enter => renderEdges(enter))
                    .call(enter => renderNodes(enter)),
                update => update,
                exit => exit.remove()
            )

        function renderEdges(enter: d3.Selection<SVGCircleElement, INodesGroupBy<INodes, IEdges<INodes>>, SVGGElement, unknown>) {
            enter.selectAll(".network-link")
            .data(d => d.edges)
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
        }

        // let edges = _this.elements.contentContainer.selectAll(".network-link")
        //     .data(_this.data.edges)
        //     .join(
        //         enter => enter.append("line")
        //             .attr("class", "network-link")
        //             .classed("reflection-link", d => d.isReflection)
        //             .attr("x1", _this.width / 2)
        //             .attr("y1", _this.height / 2)
        //             .attr("x2", _this.width / 2)
        //             .attr("y2", _this.height / 2)
        //             .call(enter => enter.transition()
        //             .duration(750)
        //             .attr("x1", d => (d.source as INodes).x)
        //             .attr("y1", d => (d.source as INodes).y)
        //             .attr("x2", d => (d.target as INodes).x)
        //             .attr("y2", d => (d.target as INodes).y)),
        //         update => update.call(update => update.transition()
        //             .duration(750)               
        //             .attr("x1", d => (d.source as INodes).x)
        //             .attr("y1", d => (d.source as INodes).y)
        //             .attr("x2", d => (d.target as INodes).x)
        //             .attr("y2", d => (d.target as INodes).y)),
        //         exit => exit.remove()
        //     );
        
        function renderNodes(enter: d3.Selection<SVGCircleElement, INodesGroupBy<INodes, IEdges<INodes>>, SVGGElement, unknown>) {
            enter.selectAll(".network-node-group")
            .data(d => d.nodes)
            .join(
                enter => enter.append("g")
                    .attr("class", "network-node-group pointer")
                    .attr("transform", `translate(${_this.width / 2}, ${_this.height / 2})`)
                    .call(enter => enter.append("rect")
                        .attr("class", "network-node")
                        .attr("rx", 10)
                        .attr("ry", 10)
                        .style("fill", d => d.properties["color"])
                        .style("stroke", d => d.properties["color"]))
                    .call(enter => enter.append("text")
                        .attr("id", d => `text-${d.idx}`)
                        .attr("class", "network-text")
                        .style("dominant-baseline", "central"))
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
        }

        // let nodes = _this.elements.content = _this.elements.contentContainer.selectAll(".network-node-group")
        //     .data(_this.data.nodes)
        //     .join(
        //         enter => enter.append("g")
        //             .attr("class", "network-node-group pointer")
        //             .attr("transform", `translate(${_this.width / 2}, ${_this.height / 2})`)
        //             .call(enter => enter.append("rect")
        //                 .attr("class", "network-node")
        //                 .attr("rx", 10)
        //                 .attr("ry", 10)
        //                 .style("fill", d => d.properties["color"])
        //                 .style("stroke", d => d.properties["color"]))
        //             .call(enter => enter.append("text")
        //                 .attr("id", d => `text-${d.idx}`)
        //                 .attr("class", "network-text")
        //                 .style("dominant-baseline", "central"))
        //             .call(enter => enter.select("rect")
        //                 .attr("x", -5)
        //                 .attr("y", -5)
        //                 .attr("width", 10)
        //                 .attr("height", 10))
        //             .call(enter => enter.transition()
        //                 .duration(750)
        //                 .attr("transform", d => `translate(${d.x}, ${d.y})`)),
        //         update => update.call(update => update.transition()
        //             .duration(750)
        //             .attr("transform", d => `translate(${d.x}, ${d.y})`))
        //             .call(update => update.select("rect")
        //                 .style("fill", d => d.properties["color"])
        //                 .style("stroke", d => d.properties["color"]))
        //             .call(update => update.select("text")
        //                 .attr("id", d => `text-${d.idx}`)),
        //         exit => exit.remove()
        //     );
        
        _this.elements.content = _this.elements.contentContainer.selectAll(".network-node-group");

        const groupByTicked = () => {
            _this.elements.contentContainer.selectAll<SVGGElement, INodesGroupBy<INodes, IEdges<INodes>>>(".network-groupby")
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
        }
        _this.groupBySimulation.on("tick", groupByTicked)

        const ticked = () => {
            _this.elements.contentContainer.selectAll<SVGLineElement, IEdges<INodes>>(".network-link")
                .attr("x1", d => (d.source as INodes).x)
                .attr("y1", d => (d.source as INodes).y)
                .attr("x2", d => (d.target as INodes).x)
                .attr("y2", d => (d.target as INodes).y)

            _this.elements.contentContainer.selectAll<SVGLineElement, INodes>(".network-node-group")
                .attr("transform", (d: INodes) => `translate(${d.x}, ${d.y})`)
        }
        _this.simulation.on("tick", ticked)

        const onMouseover = function(e: MouseEvent, d: INodes) {
            if (select(this).attr("class").includes("clicked")) {
                return
            }
            _this.simulation.alphaTarget(0.3).restart()
            const nodes = _this.getTooltipNodes(_this.data, d)
            const datum = select<SVGGElement, INodes>(this).datum()
            datum.fx = datum.x
            datum.fy = datum.y
            _this.openNodes(nodes)
        }
        const onMouseout = function() {
            if (select(this).attr("class").includes("clicked")) {
                return
            }
            const datum = select<SVGGElement, INodes>(this).datum()
            datum.fx = null
            datum.fy = null
            _this.closeNodes()
            _this.tooltip.removeTooltip()
            _this.simulation.alphaTarget(0)
        }
        //Enable tooltip       
        _this.tooltip.enableTooltip(onMouseover, onMouseout);

        const zoomed = function(e: d3.D3ZoomEvent<SVGRectElement, unknown>) {
            if (e.sourceEvent !== null) {
                if (e.sourceEvent.type === "dblclick") return
                if (e.sourceEvent.type === "wheel") {
                    window.scrollBy({ top: e.sourceEvent.deltaY, behavior: 'smooth' })
                    return
                }
            }
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
        //Enable zoom
        _this.zoom.enableZoom(zoomed)
    }
    getTooltipNodes(data: IAnalytics, nodeData: INodes): INodes[] {
        let edges = data.edges.filter(d => d.source === nodeData).map(d => d.target as INodes);
        edges = edges.concat(data.edges.filter(d => d.target === nodeData).map(d => d.source as INodes));
        edges.push(nodeData);
        return edges;
    }
    openNodes(data: INodes[]): void {
        const calculateWH = (enter: d3.Selection<SVGGElement, INodes, HTMLElement, any>, d: INodes, applyForce?: boolean): {width: number, height: number} => {
            const clientRect = enter.select<SVGTextElement>(`#text-${d.idx}`).node().getBoundingClientRect()
            const width = clientRect.width + 10
            const height = clientRect.height + 5
            if (applyForce) this.simulation.force("collide", forceCollide().radius(d => enter.data().map(c => c.index).includes(d.index) ? width / 2 : 10))
            return {width, height}
        }

        selectAll<SVGGElement, INodes>(".network-node-group")
            .filter(c => data.includes(c))
            .call(enter => enter.select("text")
                .text(d => d.expression)
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", "1"))
            .call(enter => enter.select(".network-node")
                .transition()
                .duration(500)
                .attr("x", d => -calculateWH(enter, d).width / 2)
                .attr("y", d => -calculateWH(enter, d).height / 2)
                .attr("width", d => calculateWH(enter, d).width)
                .attr("height", d => calculateWH(enter, d, true).height))
    }
    closeNodes(): void {
        this.simulation.force("collide", forceCollide().radius(10))
        selectAll<SVGGElement, INodes>(".network-node-group:not(.clicked)")
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
    }
    processGroupBySimulation() {
        this.groupBySimulation = forceSimulation<INodesGroupBy<INodes, IEdges<INodes>>>(this.networkData)
            .force("charge", forceManyBody().strength(0))
            .force("collide", forceCollide().radius(10))
            .force("center", forceCenter((this.width -this.padding.yAxis - this.padding.right - 10) / 2, (this.height - this.padding.top - this.padding.xAxis + 5) / 2))
            .force("forceX", forceY((this.width -this.padding.yAxis - this.padding.right - 10) / 2).strength(0.02))
    }
    processSimulation(data: IAnalytics) {
        this.simulation = forceSimulation<INodes, undefined>(data.nodes)
            .force("link", forceLink<INodes, IEdges<INodes>>()
                .id(d => d.idx)
                .distance(100)
                .links(data.edges))
            .force("charge", forceManyBody().strength(0))
            .force("collide", forceCollide().radius(10))
            .force("center", forceCenter((this.width -this.padding.yAxis - this.padding.right - 10) / 2, (this.height - this.padding.top - this.padding.xAxis + 5) / 2))
            .force("forceX", forceY((this.width -this.padding.yAxis - this.padding.right - 10) / 2).strength(0.02))
    }
    private processData() {
        this.networkData = groupBy(this.data.nodes, this.groupByKey).map(c => {
            return {
                "key": c.key,
                "nodes": c.value,
                "edges": this.data.edges.filter(d => c.value.map(a => a.idx).includes((d.source as INodes).idx && (d.target as INodes).idx))
            } as INodesGroupBy<INodes, IEdges<INodes>>
        })
    }
    private filterData(data: IAnalytics): IAnalytics {
        let nodes = data.nodes.filter(d => d.selected)
        let edges = data.edges.filter(d => (d.source as INodes).selected && (d.target as INodes).selected)
        return { "name": data.name, "description": data.description, "nodes": nodes, "edges": edges }
    }
}

class ClickNetwork<T extends Network> extends Click<T> {
    removeClick(): void {
        super.removeClick()
        this.chart.closeNodes()
        selectAll<HTMLSpanElement, unknown>("#reflections .reflections-tab span")
            .style("background-color", null)
        
    }
}