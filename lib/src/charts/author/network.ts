import { select, selectAll, forceSimulation, forceLink, forceManyBody, forceCollide, forceY, scaleLinear, forceX, line, curveMonotoneX, curveBasis, sort } from "d3";
import { AuthorAnalytics, EdgeType, GroupByType, IAnalytics, IAuthorAnalytics, IEdges, INodes, IReflection, NodeType } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { Zoom } from "../../interactions/zoom";
import { addDays, calculateMean, maxDate, minDate } from "../../utils/utils";
import { ChartNetwork } from "../chartBase";

export class Network extends ChartNetwork {
    tooltip = new Tooltip(this)
    zoom: ZoomNetwork<this>
    groupByKey = GroupByType.Code
    clicking: ClickNetwork<this>
    groupBySimulation: d3.Simulation<INodes, undefined>
    simulation: d3.Simulation<INodes, undefined>
    extend?: Function
    private _data: IAnalytics
    get data() {
        return this._data
    }
    set data(entries: IAnalytics) {
        (async () => {
            this.loading.isLoading = true
            this._data = this.filterData(entries)
            this.x.scale.domain([addDays(minDate(entries.reflections.map(d => d.timestamp)), -30), addDays(maxDate(entries.reflections.map(d => d.timestamp)), 30)])
            if (this.data.nodes.some(d => d.index === undefined)) this.processSimulation()
            try {
                await this.render()
            } catch (e) {
                this.renderError(e)
            }
            this.extend !== undefined ? this.extend() : null
            this.loading.isLoading = false
        })()
        
    }
    constructor(data: IAuthorAnalytics, domain: Date[]) {
        super("network", "chart-container.network", [addDays(minDate(domain), -30), addDays(maxDate(domain), 30)])
        this.clicking = new ClickNetwork(this)
        this.zoom = new ZoomNetwork(this)
        this.data = data
    }
    async render() {
        const _this = this

        _this.renderLines()

        let edges = _this.elements.contentContainer.selectAll(".network-link")
            .data(_this.data.edges as IEdges<INodes>[])
            .join(
                enter => enter.append("line")
                    .attr("class", "network-link")
                    .classed("reflection-link", d => d.edgeType == EdgeType.Ref)
                    .attr("x1", _this.width / 2)
                    .attr("y1", _this.height / 2)
                    .attr("x2", _this.width / 2)
                    .attr("y2", _this.height / 2),
                update => update.call(update => update
                    .classed("reflection-link", d => d.edgeType == EdgeType.Ref)
                    .transition()
                    .duration(750)               
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y)),
                exit => exit.remove()
            )
        
        let nodes = _this.elements.content = _this.elements.contentContainer.selectAll(".network-node-group")
            .data(_this.data.nodes)
            .join(
                enter => enter.append("g")
                    .attr("class", "network-node-group pointer")
                    .classed("groupby", d => d.nodeType == NodeType.Grp)
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
                        .attr("width", d => this.rScale(d, enter))
                        .attr("height", d => this.rScale(d, enter))),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", d => `translate(${d.x}, ${d.y})`))
                    .call(update => update.select("rect")
                        .style("fill", d => d.properties["color"])
                        .style("stroke", d => d.properties["color"])
                        .attr("width", d => this.rScale(d, update))
                        .attr("height", d => this.rScale(d, update)))
                    .call(update => update.select("text")
                        .attr("id", d => `text-${d.idx}`)),
                exit => exit.remove()
            );
        
        _this.elements.content = _this.elements.contentContainer.selectAll(".network-node-group");

        const ticked = () => {
            edges.transition()
                .duration(50)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

            nodes.transition()
                .duration(50)
                .attr("transform", d => { 
                    const x = d.fx !== undefined ? d.fx : d.x
                    const y = d.fy !== undefined ? d.fy : d.y 
                    return `translate(${_this.x.withinRange(x)}, ${_this.y.withinRange(y)})` 
                })
        }
        if (this.simulation !== undefined) _this.simulation.on("tick", ticked)

        const onMouseover = function(e: MouseEvent, d: INodes) {
            if (select(this).attr("class").includes("clicked")) {
                return
            }
            if (_this.zoom.k == 1) _this.simulation.alphaTarget(0.3).restart()
            const nodes = _this.getTooltipNodes(_this.data, d)
            if (d.nodeType !== NodeType.Ref) {
                const datum = select<SVGGElement, INodes>(this).datum()
                datum.fx = datum.x
                datum.fy = datum.y
            }           
            _this.openNodes(nodes, true)
            if (_this.zoom.k == 1) setTimeout(() => _this.simulation.alphaTarget(0), 100)
        }
        const onMouseout = function(e: MouseEvent, d: INodes) {
            if (select(this).attr("class").includes("clicked")) {
                return
            }
            if (d.nodeType !== NodeType.Ref) {
                const datum = select<SVGGElement, INodes>(this).datum()
                datum.fx = undefined
                datum.fy = undefined
            }
            const simulationFinished = _this.simulation.alphaTarget() === 0
            if (simulationFinished && _this.zoom.k == 1) _this.simulation.alphaTarget(0.3).restart()
            _this.closeNodes(true)
            _this.tooltip.removeTooltip()
            if (simulationFinished && _this.zoom.k == 1) {
                setTimeout(() => _this.simulation.alphaTarget(0), 500)
                return
            }
            _this.simulation.alphaTarget(0)
        }
        //Enable tooltip       
        _this.tooltip.enableTooltip(onMouseover, onMouseout);

        const zoomed = (e: d3.D3ZoomEvent<SVGRectElement, unknown>) => {
            if (e.sourceEvent !== null) {
                if (e.sourceEvent.type === "dblclick") return
                if (e.sourceEvent.type === "wheel") {
                    window.scrollBy({ top: e.sourceEvent.deltaY, behavior: 'smooth' })
                    return
                }
            }
            const newChartRange = [0, _this.width - _this.padding.yAxis - _this.padding.right].map(d => e.transform.applyX(d))
            _this.x.scale.rangeRound(newChartRange)

            _this.elements.contentContainer.selectAll<SVGLineElement, any>(".network-link")
                .attr("x1", d => e.transform.applyX(d.source.x))
                .attr("x2", d => e.transform.applyX(d.target.x))

            _this.elements.contentContainer.selectAll<SVGGElement, INodes>(".network-node-group")
                .attr("transform", d => { 
                    const x = d.fx !== undefined ? d.fx : d.x
                    const y = d.fy !== undefined ? d.fy : d.y 
                    return `translate(${_this.x.withinRange(e.transform.applyX(x))}, ${_this.y.withinRange(y)})`
                })

            _this.elements.contentContainer.selectAll(".timeline-line-container")
                .data(_this.getLines())
                .select("path")
                .attr("d", d => d.line(d.datum))

            _this.x.axis.ticks(newChartRange[1] / 75)
            _this.elements.xAxis.call(_this.x.axis)
            _this.help.removeHelp()
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
    openNodes(data: INodes[], applyForce?: boolean): void {
        const calculateWH = (enter: d3.Selection<SVGGElement, INodes, HTMLElement, any>, d: INodes, last?: boolean): {width: number, height: number} => {
            const clientRect = enter.select<SVGTextElement>(`#text-${d.idx}`).node().getBoundingClientRect()
            const width = clientRect.width + 10
            const height = clientRect.height + 5
            if (applyForce && last) {
                this.simulation.force("collide", forceCollide().radius(d => enter.data().map(c => c.index).includes(d.index) ? width / 3 : 10))
            }
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
    closeNodes(applyForce?: boolean): void {
        if (applyForce) this.simulation.force("collide", forceCollide().radius(10))
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
                .attr("width", d => this.rScale(d, enter))
                .attr("height", d => this.rScale(d, enter)))
    }
    private processSimulation() {
        this.simulation = forceSimulation<INodes, undefined>(this.data.nodes)
            .force("link", forceLink<INodes, IEdges<INodes>>()
                .id(d => d.idx)
                .distance(50)
                .links(this.data.edges as IEdges<INodes>[]))
            .force("charge", forceManyBody().strength(0))
            .force("collide", forceCollide().radius(10))
            .force("forceY", forceY<INodes>(d => this.setYForce(d)).strength(d => this.setYForce(d) !== 0 ? 0.25 : 0))
            .force("forceX", forceX<INodes>(d => this.setXForce(d)).strength(d => this.setXForce(d) !== 0 ? 0.25 : 0))
        this.fixGroupNodes()
    }
    private setYForce(d: INodes): number {
        const ref = this.data.reflections.find(r => r.refId == d.refId)
        const y = this.y.scale(ref?.point)
        if (y < 20) {
            return 20
        } else if (this.height - this.padding.top - this.padding.xAxis - 20 < y) {
            return -20
        } else {
            return 0
        }
    }
    private setXForce(d: INodes): number {
        const ref = this.data.reflections.find(r => r.refId == d.refId)
        const x = this.x.scale(ref?.timestamp)
        if (x < 20) {
            return 20
        } else if (this.width - this.padding.yAxis - this.padding.right - 20 < x) {
            return -20
        } else {
            return 0
        }
    }
    private filterData(data: IAnalytics): IAnalytics {
        let nodes = data.nodes.filter(d => d.selected)
        let edges = data.edges.filter(d => d.selected)
        return new AuthorAnalytics(data.reflections, nodes, edges as IEdges<INodes>[], this.groupByKey)
    }
    private fixGroupNodes() {
        this.data.nodes.filter(d => d.nodeType === NodeType.Ref).forEach(d => { 
            let ref = this.data.reflections.find(c => c.refId == d.refId)
            d.fx = this.x.scale(ref?.timestamp)
            d.fy = this.y.scale(ref?.point)
        })
    }
    private rScale(d: INodes, enter: d3.Selection<SVGGElement | d3.BaseType, INodes, SVGGElement | HTMLElement, unknown>): number { 
        return scaleLinear()
            .domain([1, Math.max.apply(null, enter.data().filter(c => c.refId == d.refId).map(c => c.total)) + 1])
            .range([10, 30])(d.total)
    }
    private renderLines() {
        this.elements.contentContainer.selectAll(".timeline-line-container")
        .data(this.getLines())
        .join(
            enter => enter.append("g")
                .attr("class", "timeline-line-container")
                .attr("clip-path", `url(#clip-${this.id})`)
                .call(enter => enter.append("path")
                    .datum(d => d)
                    .attr("class", d => d.name)
                    .attr("d", d => d.line(d.datum))),
            update => update.select("path")
                .call(update => update.transition()
                    .duration(750)
                    .attr("d", d => d.line(d.datum))),
            exit => exit.remove()
        )
    }
    private getLines() {
        const hardLine = line<IReflection>()
            .x(d => this.x.scale(d.timestamp))
            .y(d => this.y.scale(d.point))
            .curve(curveMonotoneX)

        const softLine = line<IReflection>()
            .x(d => this.x.scale(d.timestamp))
            .y(d => this.y.scale(d.point))
            .curve(curveBasis)
        
        const mean = calculateMean(this.data.reflections.map(d => d.point))
        const meanLine = line<IReflection>()
            .x(d => this.x.scale(d.timestamp))
            .y(this.y.scale(mean))
        
        return [
            {"name": "hardline", "line": hardLine, "datum": sort(this.data.reflections, d => d.timestamp)},
            {"name": "softline", "line": softLine, "datum": sort(this.data.reflections, d => d.timestamp)},
            {"name": "meanline", "line": meanLine, "datum": sort(this.data.reflections, d => d.timestamp)}
        ]
    }
}

class ClickNetwork<T extends Network> extends Click<T> {
    removeClick(): void {
        super.removeClick()
        this.chart.closeNodes()
        selectAll<HTMLSpanElement, unknown>("#reflections .reflections-tab span")
            .style("background-color", null)   
        selectAll("#reflections i")
            .classed("selected", false)   
    }
}

class ZoomNetwork<T extends Network> extends Zoom<T> {
    protected handleZoomMinus(): void {
        this.chart.simulation.stop()
        setTimeout(() => super.handleZoomMinus(), 100)
    }
    protected handleZoomPlus(): void {
        this.chart.simulation.stop()
        setTimeout(() => super.handleZoomPlus(), 100)
    }
}