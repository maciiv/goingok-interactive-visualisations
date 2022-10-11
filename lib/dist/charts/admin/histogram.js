;
import { HistogramData } from "../../data/data.js";
import { ClickAdmin } from "../../interactions/click.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { groupBy, calculateMean } from "../../utils/utils.js";
import { ChartSeries, ChartPadding } from "../chartBase.js";
import { ChartElements } from "../render.js";
import { ChartSeriesAxis } from "../scaleBase.js";
export class Histogram extends ChartSeries {
    constructor(data) {
        super("histogram", data.map(d => d.group));
        this.tooltip = new Tooltip();
        this.transitions = new Transitions();
        this.clicking = new ClickAdmin();
        this.padding = new ChartPadding(40, 75, 5, 85);
        this.x = new ChartSeriesAxis("Group Code", data.map(d => d.group), [0, this.width - this.padding.yAxis - this.padding.right]);
        d3.select(`#${this.id} svg`).remove();
        this.thresholdAxis = this.y.setThresholdAxis(30, 70);
        this.elements = new HistogramChartElements(this);
        this.data = data;
    }
    get data() {
        return this._data;
    }
    set data(entries) {
        this._data = entries.filter(d => d.selected);
        this.x.scale.domain(entries.filter(d => d.selected).map(d => d.group));
        this.bandwidth = d3.scaleLinear()
            .range([0, this.x.scale.bandwidth()])
            .domain([-100, 100]);
        this.transitions.axisSeries(this, this.data);
        this.render();
        this.extend !== undefined && this.dashboard !== undefined ? this.extend(this.dashboard) : null;
    }
    getBinData(d) {
        const bin = d3.bin().domain([0, 100]).thresholds([0, this.elements.getThresholdsValues(this)[0], this.elements.getThresholdsValues(this)[1]]);
        const usersData = groupBy(d.value, "pseudonym").map(c => { return { "pseudonym": c.key, "mean": calculateMean(c.value.map(r => r.point)) }; });
        return bin(usersData.map(c => c.mean)).map(c => {
            return new HistogramData(d.value.filter(a => usersData.filter(r => c.includes(r.mean)).map(r => r.pseudonym).includes(a.pseudonym)), d.group, d.colour, c, Math.round(c.length / usersData.length * 100));
        });
    }
    render() {
        const _this = this;
        d3.select(`#${_this.id} .card-subtitle`)
            .html(_this.data.length == 1 ? `Filtering by <span class="badge badge-pill badge-info pointer">${_this.data[0].group} <i class="fas fa-window-close"></i></span>` :
            "");
        //Process histogram
        _this.elements.contentContainer.selectAll(`.${_this.id}-histogram-container`)
            .data(_this.data)
            .join(enter => enter.append("g")
            .attr("class", `${_this.id}-histogram-container`)
            .attr("transform", d => `translate(${_this.x.scale(d.group)}, 0)`)
            .call(enter => enter.selectAll(".histogram-rect")
            .data(d => _this.getBinData(d))
            .enter()
            .append("rect")
            .attr("id", `${_this.id}-data`)
            .attr("class", "histogram-rect")
            .attr("x", c => _this.bandwidth(-c.percentage))
            .attr("y", c => _this.y.scale(c.bin.x0))
            .attr("height", 0)
            .attr("width", c => _this.bandwidth(c.percentage) - _this.bandwidth(-c.percentage))
            .style("stroke", c => c.colour)
            .style("fill", c => c.colour)
            .transition()
            .duration(750)
            .attr("y", c => _this.y.scale(c.bin.x1))
            .attr("height", c => _this.y.scale(c.bin.x0) - _this.y.scale(c.bin.x1))), update => update
            .call(update => update.selectAll(".histogram-rect")
            .data(d => _this.getBinData(d))
            .join(enter => enter, update => update.style("stroke", d => d.colour)
            .style("fill", d => d.colour)
            .call(update => update.transition()
            .duration(750)
            .attr("x", d => _this.bandwidth(-d.percentage))
            .attr("y", d => _this.y.scale(d.bin.x1))
            .attr("height", d => _this.y.scale(d.bin.x0) - _this.y.scale(d.bin.x1))
            .attr("width", d => _this.bandwidth(d.percentage) - _this.bandwidth(-d.percentage))), exit => exit))
            .call(update => update.transition()
            .duration(750)
            .attr("transform", d => `translate(${_this.x.scale(d.group)}, 0)`)), exit => exit
            .call(exit => exit.selectAll(".histogram-rect")
            .style("fill", "#cccccc")
            .style("stroke", "#b3b3b3")
            .transition()
            .duration(250)
            .attr("y", c => _this.y.scale(c.bin.x0))
            .attr("height", 0))
            .call(exit => exit.transition()
            .duration(250)
            .remove()));
        _this.elements.content = _this.elements.contentContainer.selectAll(`#${_this.id}-data`);
        //Append tooltip container
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);
        function onMouseover(e, d) {
            _this.tooltip.appendTooltipContainer(_this);
            let tooltipBox = _this.tooltip.appendTooltipText(_this, d.bin.x0 == 0 ? "Distressed" : d.bin.x1 == 100 ? "Soaring" : "GoingOK", [new TooltipValues("Total", `${d.bin.length} (${d.percentage}%)`)]);
            _this.tooltip.positionTooltipContainer(_this, _this.x.scale(d.group) + _this.bandwidth(d.bin.length), d.bin.x1 > 25 ? _this.y.scale(d.bin.x1) : _this.y.scale(d.bin.x0) - tooltipBox.node().getBBox().height);
        }
        function onMouseout() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.tooltip.removeTooltip(_this);
        }
        if (_this.click) {
            const clickData = this.elements.contentContainer.select(".clicked").datum();
            _this.clicking.removeClick(this);
            _this.clicking.appendThresholdPercentages(this, _this.data, clickData);
        }
    }
}
class HistogramChartElements extends ChartElements {
    constructor(chart) {
        super(chart);
        let thresholds = this.getThresholdsValues(chart);
        this.appendThresholdAxis(chart);
        this.appendThresholdIndicators(chart, thresholds);
        this.appendThresholdLabel(chart);
    }
    appendThresholdAxis(chart) {
        return this.contentContainer.append("g")
            .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right}, 0)`)
            .attr("class", "threshold-axis")
            .call(chart.thresholdAxis);
    }
    ;
    appendThresholdLabel(chart) {
        let label = this.svg.append("g")
            .attr("class", "threshold-label-container");
        label.append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text("Thresholds");
        label.attr("transform", `translate(${chart.width - chart.padding.right + this.contentContainer.select(".threshold-axis").node().getBBox().width + label.node().getBBox().height}, ${chart.padding.top + this.svg.select(".y-axis").node().getBBox().height / 2}) rotate(-90)`);
        return label;
    }
    ;
    appendThresholdIndicators(chart, thresholds) {
        this.contentContainer.selectAll(".threshold-indicator-container")
            .data(thresholds)
            .enter()
            .append("g")
            .attr("class", "threshold-indicator-container")
            .classed("distressed", d => d < 50 ? true : false)
            .classed("soaring", d => d > 50 ? true : false)
            .attr("transform", d => `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${d < 50 ? chart.y.scale(d) + 25 : chart.y.scale(d) - 15})`)
            .call(g => g.append("rect")
            .attr("class", "threshold-indicator-box")
            .classed("distressed", d => d < 50 ? true : false)
            .classed("soaring", d => d > 50 ? true : false))
            .call(g => g.append("text")
            .attr("class", "threshold-indicator-text")
            .attr("x", 5)
            .text(d => d))
            .call(g => g.selectAll("rect")
            .attr("width", g.select("text").node().getBBox().width + 10)
            .attr("height", g.select("text").node().getBBox().height + 5)
            .attr("y", -g.select("text").node().getBBox().height));
        this.contentContainer.selectAll(".threshold-line")
            .data(thresholds)
            .enter()
            .append("line")
            .attr("class", "threshold-line")
            .classed("distressed", d => d < 50 ? true : false)
            .classed("soaring", d => d > 50 ? true : false)
            .attr("x1", 0)
            .attr("x2", chart.width - chart.padding.yAxis - chart.padding.right)
            .attr("y1", d => chart.y.scale(d))
            .attr("y2", d => chart.y.scale(d));
    }
    getThresholdsValues(chart) {
        let result = [30, 70];
        let dThreshold = this.contentContainer.select(".threshold-line.distressed");
        if (!dThreshold.empty()) {
            result[0] = chart.y.scale.invert(parseInt(dThreshold.attr("y1")));
        }
        let sThreshold = this.contentContainer.select(".threshold-line.soaring");
        if (!sThreshold.empty()) {
            result[1] = chart.y.scale.invert(parseInt(sThreshold.attr("y1")));
        }
        return result;
    }
    ;
}
