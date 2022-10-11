import d3 from "d3";
import { AnalyticsType, IAuthorAnalyticsData, INodes, IReflection, IReflectionAnalytics } from "../../data/data.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { addDays, maxDate, minDate } from "../../utils/utils.js";
import { ChartPadding, ChartTime } from "../chartBase.js";

export class TimelineNetwork extends ChartTime {
    tooltip = new Tooltip()
    analytics: IReflectionAnalytics
    private _data: IAuthorAnalyticsData
    get data() {
        return this._data
    }
    set data(entries: IAuthorAnalyticsData) {
        this._data = entries
        if (this.analytics === undefined) {
            d3.select(`#${this.id} .chart-container`).html("Chart not found")
            return
        }
        this.render()
    }
    constructor(data: IAuthorAnalyticsData){
        super("timeline", [addDays(minDate(data.reflections.map(d => d.timestamp)), -30), addDays(maxDate(data.reflections.map(d => d.timestamp)), 30)], new ChartPadding(40, 75, 10, 10))
        this.analytics = data.analytics.find(c => c.name == AnalyticsType.Timeline.toString())
        this.analytics === undefined ? 
            d3.select(`#${this.id} .chart-container`).html("Chart not found") : 
            data.reflections.forEach(c => this.simulation(this.y.scale(c.timestamp), this.x.scale(c.point)))
        this.data = data
    }
    render() {
        const _this = this

        const hardLine = d3.line<IReflection>()
            .x(d => _this.x.scale(d.timestamp))
            .y(d => _this.y.scale(d.point))
            .curve(d3.curveMonotoneX);

        if (_this.elements.contentContainer.select(".hardline").empty()) {
            _this.elements.contentContainer.append("path")
                .datum(d3.sort(_this.data.reflections, d => d.timestamp))
                .attr("class", "hardline")
                .attr("d", d => hardLine(d));
        }
        
        _this.elements.contentContainer.selectAll(".circle-tag-container")
            .data(_this.data.reflections)
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
            );
        
        _this.elements.content = _this.elements.contentContainer.selectAll(".circle");

        //Enable tooltip       
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);
        function onMouseover(e: Event, d: IReflection) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.tooltip.appendTooltipContainer(_this);
            let tooltipValues = [new TooltipValues("Point", d.point)];
            let tags = Array.from(d3.rollup(_this.analytics.nodes.filter(c => c.refId == d.refId), d => d.length, d  => d.name), ([name, total]) => ({name, total}));
            tags.forEach(c => {
                tooltipValues.push(new TooltipValues(c.name, c.total));
            })
            let tooltipBox = _this.tooltip.appendTooltipText(_this, d.timestamp.toDateString(), tooltipValues);
            _this.tooltip.positionTooltipContainer(_this, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));

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
            };

            _this.tooltip.appendLine(_this, 0, _this.y.scale(d.point), _this.x.scale(d.timestamp), _this.y.scale(d.point), "#999999");
            _this.tooltip.appendLine(_this, _this.x.scale(d.timestamp), _this.y.scale(0), _this.x.scale(d.timestamp), _this.y.scale(d.point), "#999999");
        }

        function onMouseout() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.tooltip.removeTooltip(_this);
        }
    }
    private renderReflectionNetwork(enter: d3.Selection<SVGGElement | d3.BaseType, IReflection, SVGGElement, unknown>) {
        enter.selectAll(".circle-tag")
            .data(d => this.analytics.nodes.filter(c => c.refId == d.refId))
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
    private simulation(centerY: number, centerX: number): void {
        let simulation = d3.forceSimulation<INodes, undefined>(this.analytics.nodes)
            .force("collide", d3.forceCollide().radius(5))
            .force("forceRadial", d3.forceRadial(0, 0).radius(15));
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
        return simulation.tick(300);
    }
}