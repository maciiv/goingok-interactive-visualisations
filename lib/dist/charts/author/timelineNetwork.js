;
import { Click } from "../../interactions/click.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { addDays, groupBy, maxDate, minDate } from "../../utils/utils.js";
import { ChartPadding, ChartTime } from "../chartBase.js";
export class TimelineNetwork extends ChartTime {
    constructor(data) {
        super("timeline", [addDays(minDate(data.map(d => d.timestamp)), -30), addDays(maxDate(data.map(d => d.timestamp)), 30)], new ChartPadding(40, 75, 10, 10));
        this.tooltip = new Tooltip();
        this.clicking = new Click();
        this.data = data.map(c => {
            this.simulation(c);
            return c;
        });
    }
    get data() {
        return this._data;
    }
    set data(entries) {
        this._data = entries.map(c => {
            c.nodes = c.nodes.filter(d => d.selected);
            return c;
        });
        this.render();
        this.extend !== undefined && this.dashboard !== undefined ? this.extend(this.dashboard) : null;
    }
    render() {
        const _this = this;
        const hardLine = d3.line()
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
            .join(enter => enter.append("g")
            .attr("class", "circle-tag-container")
            .call(enter => enter.append("circle")
            .attr("class", "circle")
            .attr("r", 5)
            .style("fill", "#999999")
            .style("stroke", "#999999"))
            .call(enter => _this.renderReflectionNetwork(enter))
            .call(enter => enter.transition()
            .duration(750)
            .attr("transform", d => `translate (${_this.x.scale(d.timestamp)}, ${_this.y.scale(d.point)})`)), update => update.call(update => update.transition()
            .duration(750)
            .attr("cx", d => _this.x.scale(d.timestamp))
            .attr("cy", d => _this.y.scale(d.point))
            .style("fill", "#999999")
            .style("stroke", "#999999"))
            .call(update => _this.renderReflectionNetwork(update)), exit => exit.remove());
        _this.elements.content = _this.elements.contentContainer.selectAll(".circle");
        //Enable tooltip       
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);
        function onMouseover(e, d) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.tooltip.appendTooltipContainer(_this);
            let tooltipValues = [new TooltipValues("Point", d.point)];
            let tags = groupBy(_this.data.find(c => c.refId === d.refId).nodes, "name").map(c => { return { "name": c.key, "total": c.value.length }; });
            tags.forEach(c => {
                tooltipValues.push(new TooltipValues(c.name, c.total));
            });
            let tooltipBox = _this.tooltip.appendTooltipText(_this, d.timestamp.toDateString(), tooltipValues);
            _this.tooltip.positionTooltipContainer(_this, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));
            function xTooltip(x, tooltipBox) {
                let xTooltip = _this.x.scale(x);
                if (_this.width - _this.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - tooltipBox.node().getBBox().width;
                }
                return xTooltip;
            }
            ;
            function yTooltip(y, tooltipBox) {
                var yTooltip = _this.y.scale(y) - tooltipBox.node().getBBox().height - 10;
                if (yTooltip < 0) {
                    return yTooltip + tooltipBox.node().getBBox().height + 20;
                }
                return yTooltip;
            }
            ;
            _this.tooltip.appendLine(_this, 0, _this.y.scale(d.point), _this.x.scale(d.timestamp), _this.y.scale(d.point), "#999999");
            _this.tooltip.appendLine(_this, _this.x.scale(d.timestamp), _this.y.scale(0), _this.x.scale(d.timestamp), _this.y.scale(d.point), "#999999");
        }
        function onMouseout() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.tooltip.removeTooltip(_this);
        }
    }
    renderReflectionNetwork(enter) {
        enter.selectAll(".circle-tag")
            .data(d => d.nodes)
            .join(enter => enter.append("circle")
            .attr("class", "circle-tag")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 5)
            .style("fill", d => d.properties["color"])
            .style("stroke", d => d.properties["color"]), update => update.call(update => update.transition()
            .duration(750)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .style("fill", d => d.properties["color"])
            .style("stroke", d => d.properties["color"])), exit => exit.remove());
    }
    simulation(reflection) {
        let simulation = d3.forceSimulation(reflection.nodes)
            .force("collide", d3.forceCollide().radius(5))
            .force("forceRadial", d3.forceRadial(0, 0).radius(15));
        const centerY = this.y.scale(reflection.point);
        const centerX = this.x.scale(reflection.timestamp);
        if (centerY < 20) {
            simulation.force("forceY", d3.forceY(20).strength(0.25));
        }
        if (this.height - this.padding.top - this.padding.xAxis - 20 < centerY) {
            simulation.force("forceY", d3.forceY(-20).strength(0.25));
        }
        if (centerX < 20) {
            simulation.force("forceX", d3.forceX(20).strength(0.25));
        }
        if (this.width - this.padding.yAxis - this.padding.right - 20 < centerX) {
            simulation.force("forceX", d3.forceX(-20).strength(0.25));
        }
        simulation.tick(300);
    }
}