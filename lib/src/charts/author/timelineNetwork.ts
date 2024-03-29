import { select, line, curveMonotoneX, curveBasis, sort, forceSimulation, forceCollide, forceX, forceY, forceRadial, scaleLinear } from "d3";
import { INodeTags, IReflectionAnalytics } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip, TooltipValues } from "../../interactions/tooltip";
import { addDays, calculateMean, maxDate, minDate } from "../../utils/utils";
import { ChartPadding, ChartTime } from "../chartBase";

export class TimelineNetwork extends ChartTime {
    tooltip = new Tooltip(this)
    clicking: ClickTimelineNetwork<this>
    extend?: Function
    private _data: IReflectionAnalytics[]
    get data() {
        return this._data
    }
    set data(entries: IReflectionAnalytics[]) {
        (async() => {
            this.loading.isLoading = true
            this._data = entries.map(c => {
                c.nodeTags = c.nodeTags.filter(d => d.selected)
                c.nodeTags.forEach(d => d.index === undefined ? this.simulation(c) : d)
                return c
            })
            this.x.scale.domain([addDays(minDate(entries.map(d => d.timestamp)), -30), addDays(maxDate(entries.map(d => d.timestamp)), 30)])
            this.x.transition([addDays(minDate(entries.map(d => d.timestamp)), -30), addDays(maxDate(entries.map(d => d.timestamp)), 30)])
            try {
                await this.render()
            } catch (e) {
                this.renderError(e)
            }
            this.extend !== undefined ? this.extend() : null
            this.loading.isLoading = false  
        })()     
    }
    constructor(data: IReflectionAnalytics[]){
        super("timeline", [addDays(minDate(data.map(d => d.timestamp)), -30), addDays(maxDate(data.map(d => d.timestamp)), 30)], new ChartPadding(40, 75, 50, 10))
        this.elements.contentContainer.select("clipPath rect")
            .attr("height", this.height - this.padding.xAxis)
            .attr("y", -this.padding.top)
        this.clicking = new ClickTimelineNetwork(this)
        this.data = data
    }
    async render() {
        const _this = this
        
        _this.elements.contentContainer.selectAll(".timeline-line-container")
            .data(_this.getLines())
            .join(
                enter => enter.append("g")
                    .attr("class", "timeline-line-container")
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
        
        _this.elements.contentContainer.selectAll(".circle-tag-container")
            .data(_this.data)
            .join(
                enter => enter.append("g")
                    .attr("class", "circle-tag-container")
                    .call(enter => enter.append("circle")
                        .attr("class", "circle-ref pointer")
                        .attr("r", 7.5)
                        .style("fill", "#999999")
                        .style("stroke", "#999999"))
                    .call(enter => _this.renderReflectionNodes(enter))
                    .call(enter => enter.transition()
                        .duration(750)
                        .attr("transform", d => `translate (${_this.x.scale(d.timestamp)}, ${_this.y.scale(d.point)})`)),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", d => `translate (${_this.x.scale(d.timestamp)}, ${_this.y.scale(d.point)})`))
                    .call(update => _this.renderReflectionNodes(update)),
                exit => exit.remove()
            )
        
        _this.elements.content = _this.elements.contentContainer.selectAll(".circle-ref");

        const onMouseover = function() {
            if (select(this).attr("class").includes("clicked")) return
            _this.tooltip.appendTooltipContainer()
            const parentData = select<SVGGElement, IReflectionAnalytics>(select(this).node().parentElement).datum()
            let tooltipValues = [new TooltipValues("Point", parentData.point)]
            let tags = _this.data.find(c => c.refId === parentData.refId).nodeTags
            tags.forEach(c => {
                tooltipValues.push(new TooltipValues(c.name, c.total))
            })
            let tooltipBox = _this.tooltip.appendTooltipText(parentData.timestamp.toDateString(), tooltipValues);
            _this.tooltip.positionTooltipContainer(xTooltip(parentData.timestamp, tooltipBox), yTooltip(parentData.point, tooltipBox));

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

            select(this).attr("r", 10)
            _this.tooltip.appendLine(0, _this.y.scale(parentData.point), _this.x.scale(parentData.timestamp) - 10, _this.y.scale(parentData.point), "#999999")
            _this.tooltip.appendLine(_this.x.scale(parentData.timestamp), _this.y.scale(0), _this.x.scale(parentData.timestamp), _this.y.scale(parentData.point) + 10, "#999999")
        }
        const onMouseout = function() {
            _this.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0)
            _this.tooltip.removeTooltip()
            if (select(this).attr("class").includes("clicked")) return
            select(this).attr("r", 7.5)
        }
        //Enable tooltip       
        _this.tooltip.enableTooltip(onMouseover, onMouseout)
    }
    private getLines() {
        const hardLine = line<IReflectionAnalytics>()
            .x(d => this.x.scale(d.timestamp))
            .y(d => this.y.scale(d.point))
            .curve(curveMonotoneX)

        const softLine = line<IReflectionAnalytics>()
            .x(d => this.x.scale(d.timestamp))
            .y(d => this.y.scale(d.point))
            .curve(curveBasis)
        
        const mean = calculateMean(this.data.map(d => d.point))
        const meanLine = line<IReflectionAnalytics>()
            .x(d => this.x.scale(d.timestamp))
            .y(this.y.scale(mean))
        
        return [
            {"name": "hardline", "line": hardLine, "datum": sort(this.data, d => d.timestamp)},
            {"name": "softline", "line": softLine, "datum": sort(this.data, d => d.timestamp)},
            {"name": "meanline", "line": meanLine, "datum": sort(this.data, d => d.timestamp)}
        ]
    }
    private renderReflectionNodes(enter: d3.Selection<SVGGElement | d3.BaseType, IReflectionAnalytics, SVGGElement, unknown>) {
        const rScale = (d: INodeTags) => { 
            return scaleLinear()
                .domain([1, Math.max.apply(null, enter.data().find(c => c.refId == d.refId).nodeTags.map(c => c.total))])
                .range([2, 5])(d.total)
        }

        enter.selectAll(".circle-tag")
            .data(d => d.nodeTags)
            .join(
                enter => enter.append("circle")
                    .attr("class", "circle-tag")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => rScale(d))
                    .style("fill", d => d.properties["color"])
                    .style("stroke", d => d.properties["color"]),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => rScale(d))
                    .style("fill", d => d.properties["color"])
                    .style("stroke", d => d.properties["color"])),
                exit => exit.remove()
            )
    }
    private simulation(reflection: IReflectionAnalytics): void {
        let simulation = forceSimulation<INodeTags, undefined>(reflection.nodeTags)
            .force("collide", forceCollide().radius(6))
            .force("forceRadial", forceRadial(0, 0).radius(15).strength(0.5))
        const centerY = this.y.scale(reflection.point)
        const centerX = this.x.scale(reflection.timestamp)
        if (centerY < 20) {
            simulation.force("forceY", forceY(20).strength(0.25))
        }
        if (this.height - this.padding.top - this.padding.xAxis - 20 < centerY) {
            simulation.force("forceY", forceY(-20).strength(0.25))
        }
        if (centerX < 20) {
            simulation.force("forceX", forceX(20).strength(0.25))
        }
        if (this.width - this.padding.yAxis - this.padding.right - 20 < centerX) {
            simulation.force("forceX", forceX(-20).strength(0.25))
        }
        simulation.tick(300)
    }
}

class ClickTimelineNetwork<T extends TimelineNetwork> extends Click<T> {
    removeClick(): void {
        super.removeClick()
        this.chart.elements.content
            .attr("r", 7.5)
    }
}