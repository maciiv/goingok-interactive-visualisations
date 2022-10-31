import d3 from "d3";
import { INodes, IReflectionAnalytics } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { addDays, groupBy, maxDate, minDate } from "../../utils/utils.js";
import { ChartPadding, ChartTime } from "../chartBase.js";

export class TimelineNetwork extends ChartTime {
    tooltip = new Tooltip(this)
    clicking: ClickTimelineNetwork<this>
    extend?: Function
    private _data: IReflectionAnalytics[]
    get data() {
        return this._data
    }
    set data(entries: IReflectionAnalytics[]) {
        this._data = entries.map(c => {
            c.nodes = c.nodes.filter(d => d.selected)
            return c
        })
        this.render()
        this.extend !== undefined ? this.extend() : null
    }
    constructor(data: IReflectionAnalytics[]){
        super("timeline", [addDays(minDate(data.map(d => d.timestamp)), -30), addDays(maxDate(data.map(d => d.timestamp)), 30)], new ChartPadding(40, 75, 10, 10))
        this.clicking = new ClickTimelineNetwork(this)
        this.data = data.map(c => {
            this.simulation(c)
            return c
        })
    }
    render() {
        const _this = this

        const hardLine = d3.line<IReflectionAnalytics>()
            .x(d => _this.x.scale(d.timestamp))
            .y(d => _this.y.scale(d.point))
            .curve(d3.curveMonotoneX);

        if (_this.elements.contentContainer.select(".hardline").empty()) {
            _this.elements.contentContainer.append("path")
                .datum(d3.sort(_this.data, d => d.timestamp))
                .attr("class", "hardline")
                .attr("d", d => hardLine(d));
        }
        
        _this.elements.contentContainer.selectAll(".circle-tag-container")
            .data(_this.data)
            .join(
                enter => enter.append("g")
                    .attr("class", "circle-tag-container")
                    .call(enter => enter.append("circle")
                        .attr("class", "circle")
                        .attr("r", 5)
                        .style("fill", "#999999")
                        .style("stroke", "#999999"))
                    .call(enter => _this.renderReflectionNetwork(enter))
                    .call(enter => enter.transition()
                        .duration(750)
                        .attr("transform", d => `translate (${_this.x.scale(d.timestamp)}, ${_this.y.scale(d.point)})`)),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("cx", d => _this.x.scale(d.timestamp))
                    .attr("cy", d => _this.y.scale(d.point))
                    .style("fill", "#999999")
                    .style("stroke", "#999999"))
                    .call(update => _this.renderReflectionNetwork(update)),
                exit => exit.remove()
            )
        
        _this.elements.content = _this.elements.contentContainer.selectAll(".circle");

        const onMouseover = function(e: Event, d: IReflectionAnalytics) {
            if (d3.select(this).attr("class").includes("clicked")) return
            _this.tooltip.appendTooltipContainer();
            let tooltipValues = [new TooltipValues("Point", d.point)]
            let tags = groupBy(_this.data.find(c => c.refId === d.refId).nodes, "name").map(c => { return {"name": c.key, "total": c.value.length}})
            tags.forEach(c => {
                tooltipValues.push(new TooltipValues(c.name, c.total));
            })
            let tooltipBox = _this.tooltip.appendTooltipText(d.timestamp.toDateString(), tooltipValues);
            _this.tooltip.positionTooltipContainer(xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));

            function xTooltip(x: Date, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                let xTooltip = _this.x.scale(x);
                if (_this.width - _this.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - tooltipBox.node().getBBox().width;
                }
                return xTooltip
            };

            function yTooltip(y: number, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                var yTooltip = _this.y.scale(y) - tooltipBox.node().getBBox().height - 10;
                if (yTooltip < 0) {
                    return yTooltip + tooltipBox.node().getBBox().height + 20;
                }
                return yTooltip;
            }

            d3.select(this).attr("r", 10)
            _this.tooltip.appendLine(0, _this.y.scale(d.point), _this.x.scale(d.timestamp) - 10, _this.y.scale(d.point), "#999999")
            _this.tooltip.appendLine(_this.x.scale(d.timestamp), _this.y.scale(0), _this.x.scale(d.timestamp), _this.y.scale(d.point) + 10, "#999999")
        }
        const onMouseout = function() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0)
            _this.tooltip.removeTooltip()
            if (d3.select(this).attr("class").includes("clicked")) return
            d3.select(this).attr("r", 5)
        }
        //Enable tooltip       
        _this.tooltip.enableTooltip(onMouseover, onMouseout)
    }
    private renderReflectionNetwork(enter: d3.Selection<SVGGElement | d3.BaseType, IReflectionAnalytics, SVGGElement, unknown>) {
        enter.selectAll(".circle-tag")
            .data(d => d.nodes)
            .join(
                enter => enter.append("circle")
                    .attr("class", "circle-tag")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", 5)
                    .style("fill", d => d.properties["color"])
                    .style("stroke", d => d.properties["color"]),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .style("fill", d => d.properties["color"])
                    .style("stroke", d => d.properties["color"])),
                exit => exit.remove()
            )
    }
    private simulation(reflection: IReflectionAnalytics): void {
        let simulation = d3.forceSimulation<INodes, undefined>(reflection.nodes)
            .force("collide", d3.forceCollide().radius(5))
            .force("forceRadial", d3.forceRadial(0, 0).radius(15))
        const centerY = this.y.scale(reflection.point)
        const centerX = this.x.scale(reflection.timestamp)
        if (centerY < 20) {
            simulation.force("forceY", d3.forceY(20).strength(0.25))
        }
        if (this.height - this.padding.top - this.padding.xAxis - 20 < centerY) {
            simulation.force("forceY", d3.forceY(-20).strength(0.25))
        }
        if (centerX < 20) {
            simulation.force("forceX", d3.forceX(20).strength(0.25))
        }
        if (this.width - this.padding.yAxis - this.padding.right - 20 < centerX) {
            simulation.force("forceX", d3.forceX(-20).strength(0.25))
        }
        simulation.tick(300)
    }
}

class ClickTimelineNetwork<T extends TimelineNetwork> extends Click<T> {
    removeClick(): void {
        super.removeClick()
        this.chart.elements.content
            .attr("r", 5)
    }
}