import d3 from "d3";
import { IAdminAnalyticsData, IReflectionAuthor, ITimelineData, TimelineData } from "../../data/data.js";
import { Tooltip, TooltipValues } from "../../interactions/tooltip.js";
import { Zoom } from "../../interactions/zoom.js";
import { ChartTime, ChartTimeZoom } from "../chartBase.js";

export class Timeline extends ChartTime {
    data: IAdminAnalyticsData[]
    zoomChart: ChartTimeZoom
    tooltip = new Tooltip()
    zoom = new Zoom()
    constructor(data: IAdminAnalyticsData[]) {
        let domain = [Math.min.apply(null, data.map(d => d.creteDate)), Math.max.apply(null, data.map(d => d.creteDate))]
        super("timeline", domain)
        this.zoomChart = new ChartTimeZoom(this, domain);
        this.data = data
        this.render()
    }
    render() {
        let _this = this

        if (_this.data.length == 0) {
            d3.select(`#${_this.id} .card-subtitle`)
                .html("");
            return;
        }

        d3.select(`#${_this.id} .card-subtitle`)
            .classed("instructions", _this.data.length <= 1)
            .classed("text-muted", _this.data.length != 1)
            .html(_this.data.length != 1 ? `The oldest reflection was on ${Math.min.apply(null, _this.data.map(d => d.creteDate)).toDateString()} in the group code ${_this.data[d3.minIndex(_this.data.map(d => d3.min(d.value.map(d => d.timestamp))))].group}, while
                the newest reflection was on ${Math.max.apply(null, _this.data.map(d => d.creteDate)).toDateString()} in the group code ${_this.data[d3.maxIndex(_this.data.map(d => d3.max(d.value.map(d => d.timestamp))))].group}` :
                `Filtering by <span class="badge badge-pill badge-info">${_this.data[0].group} <i class="fas fa-window-close"></i></span>`);

        //Draw circles
        _this.elements.contentContainer.selectAll<SVGGElement, IAdminAnalyticsData>(".timeline-container")
        .data(_this.data)
        .join(
            enter => enter.append("g")
                .attr("class", "timeline-container")
                .call(enter => _this.scatter(enter, _this)),
            update => update.call(update => _this.scatter(update, _this)),
            exit => exit.remove())     

        _this.elements.content = _this.elements.contentContainer.selectAll(".circle");

        //Enable tooltip       
        _this.tooltip.enableTooltip(_this, onMouseover, onMouseout);
        function onMouseover(e: Event, d: ITimelineData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.tooltip.appendTooltipContainer(_this);
            let tooltipBox = _this.tooltip.appendTooltipText(_this, d.timestamp.toDateString(), 
                [new TooltipValues("User", d.pseudonym), 
                 new TooltipValues("Point", d.point)]);
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
        _this.elements.zoomFocus.selectAll<SVGGElement, IAdminAnalyticsData>(".zoom-timeline-content-container")
            .data(_this.data)
            .join(
                enter => enter.append("g")
                    .attr("class", "zoom-timeline-content-container")
                    .call(enter => _this.scatter(enter, _this.zoomChart, true, true)),
                update => update.call(update => _this.scatter(update, _this.zoomChart, true, true)),
                exit => exit.remove());  
        
        _this.elements.zoomSVG.selectAll<SVGGElement, IAdminAnalyticsData>(".zoom-timeline-container")
            .data(_this.data)
            .join(
                enter => enter.append("g")
                    .attr("class", "zoom-timeline-container")
                    .call(enter => { _this.zoomChart.x.scale.rangeRound([0, _this.width - _this.padding.yAxis]); _this.scatter(enter, _this.zoomChart, true) }),
                update => update.call(update => { _this.zoomChart.x.scale.rangeRound([0, _this.width - _this.padding.yAxis]); _this.scatter(update, _this.zoomChart, true) }),
                exit => exit.remove());
           
        //Enable zoom
        _this.zoom.enableZoom(_this, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, _this.width - _this.padding.yAxis].map(d => e.transform.applyX(d));
            _this.x.scale.rangeRound(newChartRange);
            _this.zoomChart.x.scale.rangeRound([0, _this.width - _this.padding.yAxis - 5].map(d => e.transform.invertX(d)));
            let newLine = d3.line<IReflectionAuthor>()
                .x(d => _this.x.scale(d.timestamp))
                .y(d => _this.y.scale(d.point));

            _this.elements.contentContainer.selectAll<SVGCircleElement, IReflectionAuthor>(".circle")
                .attr("cx", d => _this.x.scale(d.timestamp));

            _this.elements.zoomFocus.selectAll<SVGCircleElement, IReflectionAuthor>(".zoom-content")
                .attr("cx", d => _this.zoomChart.x.scale(d.timestamp));

            _this.elements.contentContainer.selectAll<SVGLineElement, IReflectionAuthor[]>(".click-line")
                .attr("d", d => newLine(d));

            _this.elements.contentContainer.selectAll<SVGRectElement, IReflectionAuthor>(".click-container")
                .attr("transform", d => `translate(${_this.x.scale(d.timestamp)}, ${_this.y.scale(d.point)})`);

            _this.x.axis.ticks(newChartRange[1] / 75);
            _this.elements.xAxis.call(_this.x.axis);
            _this.help.removeHelp(_this);
        }
    }
    scatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom = false, invisible = false): void {
        update.selectAll("circle")
            .data(d => d.value.map(c => new TimelineData(c, d.colour, d.group)))
            .join(
                enter => enter.append("circle")
                    .attr("class", invisible ? "zoom-content" : zoom ? "circle no-hover" : "circle")
                    .attr("r", zoom ? 2 : 5)
                    .attr("cx", d => chart.x.scale(d.timestamp))
                    .attr("cy", d => chart.y.scale(d.point))
                    .attr("fill", d => d.colour)
                    .attr("stroke", d => d.colour),
                update => update .attr("fill", d => d.colour)
                    .attr("stroke", d => d.colour)
                    .call(update => update.transition()
                        .duration(750)
                        .attr("cx", d => chart.x.scale(d.timestamp))
                        .attr("cy", d => chart.y.scale(d.point))),
                exit => exit.remove())
    };
}