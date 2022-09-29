import d3 from "d3";
import { HistogramData, IAdminAnalyticsData, IAdminAnalyticsDataStats, IHistogramData } from "../../data/data.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { ChartSeries, ChartPadding } from "../chartBase.js";
import { IHistogramChartElements, HistogramChartElements } from "../render.js";
import { ChartSeriesAxis } from "../scaleBase.js";

export class Histogram extends ChartSeries {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    data: IAdminAnalyticsData[]
    tooltip = new Tooltip()
    constructor(data: IAdminAnalyticsDataStats[]) {
        super("histogram", data.map(d => d.group));
        this.padding = new ChartPadding(40, 75, 5, 85);
        this.x = new ChartSeriesAxis("Group Code", data.map(d => d.group), [0, this.width - this.padding.yAxis - this.padding.right]);
        d3.select(`#${this.id} svg`).remove();
        this.thresholdAxis = this.y.setThresholdAxis(30, 70);
        this.elements = new HistogramChartElements(this);
        this.data = data.map(d => d.getUsersData())
        this.bandwidth = d3.scaleLinear()
            .range([0, this.x.scale.bandwidth()])
            .domain([-100, 100]);
        this.render()
    }
    getBinData(d: IAdminAnalyticsData): HistogramData[] {
        let bin = d3.bin().domain([0, 100]).thresholds([0, this.elements.getThresholdsValues(this)[0], this.elements.getThresholdsValues(this)[1]]);
        return bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) })
    }
    render() {
        let _this = this

        d3.select(`#${_this.id} .card-subtitle`)
            .html(_this.data.length == 1 ? `Filtering by <span class="badge badge-pill badge-info">${_this.data[0].group} <i class="fas fa-window-close"></i></span>` :
                "");

        //Process histogram
        _this.elements.contentContainer.selectAll<SVGGElement, IAdminAnalyticsData>(`.${_this.id}-histogram-container`)
            .data(_this.data)
            .join(
                enter => enter.append("g")
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
                        .attr("height", c => _this.y.scale(c.bin.x0) - _this.y.scale(c.bin.x1))),
                update => update
                    .call(update => update.selectAll(".histogram-rect")
                        .data(d => _this.getBinData(d))
                        .join(
                            enter => enter,
                            update => update.style("stroke", d => d.colour)
                                .style("fill", d => d.colour)
                                .call(update => update.transition()
                                    .duration(750)
                                    .attr("x", d => _this.bandwidth(-d.percentage))
                                    .attr("y", d => _this.y.scale(d.bin.x1))
                                    .attr("height", d => _this.y.scale(d.bin.x0) - _this.y.scale(d.bin.x1))
                                    .attr("width", d => _this.bandwidth(d.percentage) - _this.bandwidth(-d.percentage))),
                            exit => exit))
                    .call(update => update.transition()
                        .duration(750)
                        .attr("transform", d => `translate(${_this.x.scale(d.group)}, 0)`)),
                exit => exit
                    .call(exit => exit.selectAll<SVGRectElement, IHistogramData>(".histogram-rect")
                        .style("fill", "#cccccc")
                        .style("stroke", "#b3b3b3")
                        .transition()
                        .duration(250)
                        .attr("y", c => _this.y.scale(c.bin.x0))
                        .attr("height", 0)) 
                    .call(exit => exit.transition()
                        .duration(250)   
                        .remove())
            );
        
        _this.elements.content = _this.elements.contentContainer.selectAll(`#${_this.id}-data`);

        //Append tooltip container
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);

        function onMouseover(e: Event, d: HistogramData) {
            _this.tooltip.appendTooltipContainer(_this);
            let tooltipBox =_this.tooltip.appendTooltipText(_this, d.bin.x0 == 0 ? "Distressed" : d.bin.x1 == 100 ? "Soaring" : "GoingOK" , [new TooltipValues("Total", `${d.bin.length} (${d.percentage}%)`)]);
            _this.tooltip.positionTooltipContainer(_this, _this.x.scale(d.group) + _this.bandwidth(d.bin.length), d.bin.x1 > 25 ? _this.y.scale(d.bin.x1) : _this.y.scale(d.bin.x0) - tooltipBox.node().getBBox().height);
        }
        function onMouseout() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.tooltip.removeTooltip(_this);
        }

    }
}