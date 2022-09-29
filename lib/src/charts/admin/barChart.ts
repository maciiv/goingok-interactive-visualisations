import d3 from "d3";
import { IAdminAnalyticsDataStats } from "../../data/data.js";
import { ClickAdmin } from "../../interactions/click.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { ChartSeries } from "../chartBase.js";

export class BarChart extends ChartSeries {
    private _data: IAdminAnalyticsDataStats[]
    get data() {
        return this._data
    }
    set data(entries: IAdminAnalyticsDataStats[]) {
        this._data = entries.filter(d => d.selected)
        if (this.data.length != 0) {
            this.y.scale.domain([0, d3.max(this.data.map(d => d.getStat("usersTotal").value as number))]);
            this.transitions.axisSeries(this, this.data);
            this.transitions.axisLinear(this);
        }       
        this.render();
    }
    tooltip = new Tooltip()
    transitions = new Transitions()
    clicking = new ClickAdmin()
    constructor(data: IAdminAnalyticsDataStats[]) {
        super("users", data.map(d => d.group), false, data.map(d => d.getStat("usersTotal").value as number))
        this.data = data
    }
    render(): void {
        let _this = this;

        d3.select(`#${_this.id} .card-title span`)
            .html()

        d3.select(`#${_this.id} .card-subtitle`)
            .html(_this.data.length <= 1 ? "Add more group codes from the left bar" : "Click a group code to filter");

        //Boxes processing
        _this.elements.content = _this.elements.contentContainer.selectAll<SVGRectElement, IAdminAnalyticsDataStats>(`#${_this.id}-data`)
            .data(_this.data)
            .join(
                enter => enter.append("rect")
                            .attr("id", `${_this.id}-data`)
                            .attr("class", "bar")
                            .attr("y", d => _this.y.scale(0))
                            .attr("x", d => _this.x.scale(d.group))
                            .attr("width", _this.x.scale.bandwidth())
                            .attr("height", 0)
                            .style("stroke", d => d.colour)
                            .style("fill", d => d.colour)
                            .call(update => update.transition()
                                .duration(750)
                                .attr("height", d => _this.y.scale(0) - _this.y.scale(d.getStat("usersTotal").value as number))
                                .attr("y", d => _this.y.scale(d.getStat("usersTotal").value as number))),
                update => update.style("stroke", d => d.colour)
                            .style("fill", d => d.colour)
                            .call(update => update.transition()
                                .duration(750)
                                .attr("y", d => _this.y.scale(d.getStat("usersTotal").value as number))
                                .attr("x", d => _this.x.scale(d.group))
                                .attr("width", _this.x.scale.bandwidth())
                                .attr("height", d => _this.y.scale(0) - _this.y.scale(d.getStat("usersTotal").value as number))),
                exit => exit.style("fill", "#cccccc")
                            .style("stroke", "#b3b3b3")
                            .call(exit => exit.transition()
                                .duration(250)
                                .attr("y", d => _this.y.scale(0))
                                .attr("height", 0)
                                .remove())
            );      

        //Enable tooltip
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);
        function onMouseover(e: Event, d: IAdminAnalyticsDataStats): void {
            //If box is clicked not append tooltip
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.tooltip.appendTooltipContainer(_this);

            //Append tooltip box with text
            let tooltipBox = _this.tooltip.appendTooltipText(_this, d.group, d.stats.filter((c, i) => i < 2).map(c => new TooltipValues(c.displayName, c.value as number)));

            //Position tooltip container
            _this.tooltip.positionTooltipContainer(_this, xTooltip(d.group, tooltipBox), yTooltip(d.getStat("usersTotal").value as number, tooltipBox));
            function xTooltip(x: string, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                //Position tooltip right of the box
                let xTooltip = _this.x.scale(x) + _this.x.scale.bandwidth();

                //If tooltip does not fit position left of the box
                if (_this.width - _this.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - _this.x.scale.bandwidth() - tooltipBox.node().getBBox().width;
                }

                return xTooltip
            }
            function yTooltip(y: number, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                //Position tooltip on top of the box
                let yTooltip = _this.y.scale(y) + (tooltipBox.node().getBBox().height / 2);

                //If tooltip does not fit position at the same height as the box
                if (_this.y.scale.invert(yTooltip) < 0) {
                    return _this.y.scale(y + _this.y.scale.invert(yTooltip));
                }
                return yTooltip;
            }
        }
        function onMouseout(): void {
            //Transition tooltip to opacity 0
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);

            //Remove tooltip
            _this.tooltip.removeTooltip(_this);
        }
    }
}