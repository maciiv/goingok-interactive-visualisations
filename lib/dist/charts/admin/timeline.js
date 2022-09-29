;
import { TimelineData } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { Zoom } from "../../interactions/zoom.js";
import { maxDate, minDate } from "../../utils/utils.js";
import { ChartTime, ChartTimeZoom } from "../chartBase.js";
export class Timeline extends ChartTime {
    constructor(data) {
        super("timeline", [minDate(data.map(d => minDate(d.value.map(c => c.timestamp)))), maxDate(data.map(d => maxDate(d.value.map(c => c.timestamp))))]);
        this.tooltip = new Tooltip();
        this.zoom = new Zoom();
        this.transitions = new Transitions();
        this.clicking = new Click();
        this.zoomChart = new ChartTimeZoom(this, [this.minTimelineDate(data), this.maxTimelineDate(data)]);
        this.data = data;
    }
    get data() {
        return this._data;
    }
    set data(entries) {
        this._data = entries.filter(d => d.selected);
        this.zoomChart.x.scale.domain([this.minTimelineDate(), this.maxTimelineDate()]);
        this.transitions.axisTime(this, this.data);
        if (this.click) {
            this.clicking.removeClick(this);
        }
        this.render();
    }
    render() {
        let _this = this;
        if (_this.data.length == 0) {
            d3.select(`#${_this.id} .card-subtitle`)
                .html("");
            return;
        }
        d3.select(`#${_this.id} .card-subtitle`)
            .classed("instructions", _this.data.length <= 1)
            .classed("text-muted", _this.data.length != 1)
            .html(_this.data.length != 1 ? `The oldest reflection was on ${_this.minTimelineDate().toDateString()} in the group code ${_this.data[d3.minIndex(_this.data.map(d => d3.min(d.value.map(d => d.timestamp))))].group}, while
                the newest reflection was on ${_this.maxTimelineDate().toDateString()} in the group code ${_this.data[d3.maxIndex(_this.data.map(d => d3.max(d.value.map(d => d.timestamp))))].group}` :
            `Filtering by <span class="badge badge-pill badge-info">${_this.data[0].group} <i class="fas fa-window-close"></i></span>`);
        //Draw circles
        _this.elements.contentContainer.selectAll(".timeline-container")
            .data(_this.data)
            .join(enter => enter.append("g")
            .attr("class", "timeline-container")
            .call(enter => _this.scatter(enter, _this)), update => update.call(update => _this.scatter(update, _this)), exit => exit.remove());
        _this.elements.content = _this.elements.contentContainer.selectAll(".circle");
        //Enable tooltip       
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);
        function onMouseover(e, d) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.tooltip.appendTooltipContainer(_this);
            let tooltipBox = _this.tooltip.appendTooltipText(_this, d.timestamp.toDateString(), [new TooltipValues("User", d.pseudonym),
                new TooltipValues("Point", d.point)]);
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
            _this.tooltip.appendLine(_this, 0, _this.y.scale(d.point), _this.x.scale(d.timestamp), _this.y.scale(d.point), d.colour);
            _this.tooltip.appendLine(_this, _this.x.scale(d.timestamp), _this.y.scale(0), _this.x.scale(d.timestamp), _this.y.scale(d.point), d.colour);
        }
        function onMouseout() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.tooltip.removeTooltip(_this);
        }
        //Append zoom bar
        if (_this.elements.zoomSVG == undefined) {
            _this.elements.zoomSVG = _this.zoom.appendZoomBar(_this);
            _this.elements.zoomFocus = _this.elements.zoomSVG.append("g")
                .attr("class", "zoom-focus");
        }
        //Process zoom circles
        _this.elements.zoomFocus.selectAll(".zoom-timeline-content-container")
            .data(_this.data)
            .join(enter => enter.append("g")
            .attr("class", "zoom-timeline-content-container")
            .call(enter => _this.scatter(enter, _this.zoomChart, true, true)), update => update.call(update => _this.scatter(update, _this.zoomChart, true, true)), exit => exit.remove());
        _this.elements.zoomSVG.selectAll(".zoom-timeline-container")
            .data(_this.data)
            .join(enter => enter.append("g")
            .attr("class", "zoom-timeline-container")
            .call(enter => { _this.zoomChart.x.scale.rangeRound([0, _this.width - _this.padding.yAxis]); _this.scatter(enter, _this.zoomChart, true); }), update => update.call(update => { _this.zoomChart.x.scale.rangeRound([0, _this.width - _this.padding.yAxis]); _this.scatter(update, _this.zoomChart, true); }), exit => exit.remove());
        //Enable zoom
        _this.zoom.enableZoom(_this, zoomed);
        function zoomed(e) {
            let newChartRange = [0, _this.width - _this.padding.yAxis].map(d => e.transform.applyX(d));
            _this.x.scale.rangeRound(newChartRange);
            _this.zoomChart.x.scale.rangeRound([0, _this.width - _this.padding.yAxis - 5].map(d => e.transform.invertX(d)));
            let newLine = d3.line()
                .x(d => _this.x.scale(d.timestamp))
                .y(d => _this.y.scale(d.point));
            _this.elements.contentContainer.selectAll(".circle")
                .attr("cx", d => _this.x.scale(d.timestamp));
            _this.elements.zoomFocus.selectAll(".zoom-content")
                .attr("cx", d => _this.zoomChart.x.scale(d.timestamp));
            _this.elements.contentContainer.selectAll(".click-line")
                .attr("d", d => newLine(d));
            _this.elements.contentContainer.selectAll(".click-container")
                .attr("transform", d => `translate(${_this.x.scale(d.timestamp)}, ${_this.y.scale(d.point)})`);
            _this.x.axis.ticks(newChartRange[1] / 75);
            _this.elements.xAxis.call(_this.x.axis);
            _this.help.removeHelp(_this);
        }
    }
    scatter(update, chart, zoom = false, invisible = false) {
        update.selectAll("circle")
            .data(d => d.value.map(c => new TimelineData(c, d.colour, d.group)))
            .join(enter => enter.append("circle")
            .attr("class", invisible ? "zoom-content" : zoom ? "circle no-hover" : "circle")
            .attr("r", zoom ? 2 : 5)
            .attr("cx", d => chart.x.scale(d.timestamp))
            .attr("cy", d => chart.y.scale(d.point))
            .attr("fill", d => d.colour)
            .attr("stroke", d => d.colour), update => update.attr("fill", d => d.colour)
            .attr("stroke", d => d.colour)
            .call(update => update.transition()
            .duration(750)
            .attr("cx", d => chart.x.scale(d.timestamp))
            .attr("cy", d => chart.y.scale(d.point))), exit => exit.remove());
    }
    ;
    minTimelineDate(data) {
        const processData = data === undefined ? this.data : data;
        return minDate(processData.map(d => minDate(d.value.map(c => c.timestamp))));
    }
    maxTimelineDate(data) {
        const processData = data === undefined ? this.data : data;
        return maxDate(processData.map(d => maxDate(d.value.map(c => c.timestamp))));
    }
}
