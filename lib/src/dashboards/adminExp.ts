import d3 from "d3";
import { ChartSeries } from "../charts/chartBase.js";
import { IAdminAnalyticsData, IHistogramData, IReflectionAuthor, HistogramData, ITimelineData, AdminAnalyticsData } from "../data/data.js";
import { Dashboard } from "./adminControl.js";
import { IAdminAnalyticsDataRaw, AdminAnalyticsDataRaw } from "../data/db.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";
import { Sort } from "../interactions/sort.js";
import { Help } from "../charts/help.js";

export class ExperimentalDashboard extends Dashboard {
    entries: IAdminAnalyticsData[]
    sorted = ""
    sort = new Sort()
    help = new Help()
    constructor(data: IAdminAnalyticsData[]) {
        super(data)
        this.barChart.extend = this.extendBarChart
        this.barChart.dashboard = this
        this.extendBarChart(this)
        this.histogram.extend = this.extendHistogram
        this.histogram.dashboard = this
        this.extendHistogram(this)
        this.timeline.extend = this.extendTimeline
        this.timeline.dashboard = this
        this.extendTimeline(this)
    }
    preloadGroups(entries: IAdminAnalyticsData[]): IAdminAnalyticsData[] {
        super.preloadGroups(entries, true)
        this.entries = entries;

        d3.select("#groups")
            .selectAll<HTMLLIElement, IAdminAnalyticsData>("li").select("div")
            .insert("div", "input")
            .attr("class", "input-group-prepend")
            .append("div")
            .attr("class", "input-group-text group-row")
            .append("input")
            .attr("type", "checkbox")
            .attr("value", d => d.group)
            .property("checked", true)

        return d3.filter(entries, d => d.selected == true);
    }
    handleGroups(): void {
        const _this = this;
        const inputs = d3.selectAll("#all-groups input[type=checkbox]")
        inputs.on("change", (e: Event) => {
            const target = e.target as HTMLInputElement;
            const entry = _this.entries.find(d => d.group == target.value)
            if (target.checked) {
                if (entry !== undefined) {
                    entry.selected = true
                } else {
                    _this.entries.forEach(c => c.selected = true)
                    inputs.property("checked", true)
                };
            } else {
                if (entry !== undefined) {
                    entry.selected = false
                } else {
                    _this.entries.forEach(c => c.selected = false)
                    inputs.property("checked", false)
                };
            }
            let data = _this.entries
            let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsData;
            _this.barChart.data = data
            if (_this.barChart.click) {
                if (!target.checked && target.value == clickData.group) {
                    _this.barChart.clicking.removeClick(_this.barChart);
                    _this.totals.data = data;
                    _this.timeline.data = data;
                    _this.histogram.data = data;
                } else {
                    _this.barChart.clicking.appendGroupsText(_this.barChart, data, clickData);
                }
            } else {
                _this.totals.data = data;
                _this.timeline.data = data;
                _this.histogram.data = data
            }
            _this.removeAllHelp(_this.barChart);
        });
    }
    handleGroupsColours(): void {
        const _this = this;
        d3.selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-", "");
            _this.entries.find(d => d.group == groupId).colour = target.value;
            let data = _this.entries.filter(d => d.selected)
            _this.barChart.data = data
            if (_this.barChart.click) {
                let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsData;
                if (clickData.group == groupId) {
                    _this.timeline.data = [_this.entries.find(d => d.group == groupId)];
                    _this.histogram.data = [clickData];
                }
            } else {
                _this.timeline.data = data;
                _this.histogram.data = data
            }
        });
    }
    handleGroupsSort(): void {
        const _this = this;
        const id = "sort-groups"
        d3.select(`#${id} .btn-group-toggle`).on("click", (e: any) => {
            const selectedOption = e.target.control.value
            const chevron = _this.sorted === selectedOption ? "fa-chevron-down" : "fa-chevron-up"
            _this.sort.setChevronVisibility(id, selectedOption)
            _this.entries = _this.entries.sort(function (a, b) {
                if (selectedOption == "date") {
                    _this.sort.handleChevronChange(id, selectedOption, chevron)
                    return _this.sort.sortData(a.createDate, b.createDate, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "name") {
                    _this.sort.handleChevronChange(id, selectedOption, chevron)
                    return _this.sort.sortData(a.group, b.group, _this.sorted == "name" ? true : false);
                } else if (selectedOption == "mean") {
                    _this.sort.handleChevronChange(id, selectedOption, chevron)
                    return _this.sort.sortData(d3.mean(a.value.map(d => d.point)), d3.mean(b.value.map(d => d.point)), _this.sorted == "mean" ? true : false);
                }
            });
            _this.sorted = _this.sort.setSorted(_this.sorted, selectedOption);
            let data = _this.entries.filter(d => d.selected)
            _this.barChart.data = data
            let groupClickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsData;
            if (_this.barChart.click) {              
                _this.barChart.clicking.appendGroupsText(_this.barChart, data, groupClickData);               
            } else {
                _this.histogram.data = data
                _this.users.data = data
            }
            _this.removeAllHelp(_this.barChart);
        });
    }
    handleFilterButton(): void {
        const data = this.entries.filter(d => d.selected)
        this.barChart.clicking.removeClick(this.barChart)
        this.histogram.clicking.removeClick(this.histogram)
        this.histogram.data = data
        this.timeline.data = data
        this.totals.data = data
        this.users.data = data
    }
    extendBarChart(dashboard: ExperimentalDashboard) {
        const _this = dashboard
        const chart = _this.barChart

        chart.clicking.enableClick(chart, onClick)
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick(chart)
            _this.histogram.clicking.removeClick(_this.histogram)
            _this.totals.data = chart.data
            _this.histogram.data = chart.data
            _this.timeline.data = chart.data
            _this.users.data = chart.data
        });
        function onClick(e: Event, d: IAdminAnalyticsData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                chart.clicking.removeClick(chart)
                _this.totals.data = chart.data
                _this.histogram.data = chart.data
                _this.timeline.data = chart.data
                _this.users.data = chart.data
                return;
            }
            chart.clicking.removeClick(chart)
            chart.click = true
            chart.clicking.appendGroupsText(chart, chart.data, d)
            _this.totals.data = [d]
            _this.histogram.data = chart.data.filter(c => c.group == d.group)
            _this.timeline.data = [d]
            _this.users.data = [d]
            _this.removeAllHelp(chart)
        }
    }
    extendHistogram(dashboard: ExperimentalDashboard) {
        const _this = dashboard
        const chart = _this.histogram

        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton())

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick(chart)
            _this.totals.data = chart.data
            _this.timeline.data = chart.data
            _this.users.data = chart.data
        });

        //Add drag functions to the distressed threshold
        chart.elements.contentContainer.selectAll(".threshold-line")
            .classed("grab", true)
            .call(d3.drag()
                .on("start", dragStart)
                .on("drag", dragging)
                .on("end", dragEnd))

        //Start dragging functions           
        function dragStart() {
            chart.elements.contentContainer.selectAll(`.${chart.id}-histogram-text-container`).remove()
            d3.select(this).classed("grab", false)
            d3.select(this).classed("grabbing", true)
            _this.help.removeHelp(chart)
        }
        function dragging(e: MouseEvent, d: number) {
            if (d > 50) {
                if (chart.y.scale.invert(e.y) < 51 || chart.y.scale.invert(e.y) > 99) {
                    return
                }
            } else {
                if (chart.y.scale.invert(e.y) < 1 || chart.y.scale.invert(e.y) > 49) {
                    return
                }
            }
            
            let thresholds = chart.elements.getThresholdsValues(chart)
            let tDistressed = thresholds[0]
            let tSoaring = thresholds[1]

            d3.select<SVGLineElement, number>(this)
                .datum(chart.y.scale.invert(e.y))
                .attr("y1", d => chart.y.scale(d))
                .attr("y2", d => chart.y.scale(d))
                .call(line => chart.thresholdAxis
                    .tickValues(line.datum() > 50 ? [tDistressed, line.datum()] : [line.datum(), tSoaring])
                    .tickFormat(d => line.datum() > 50 ? d == tDistressed ? "Distressed" : d == line.datum() ? "Soaring" : "" : d == line.datum() ? "Distressed" : d == tSoaring ? "Soaring" : ""))
                .call(line =>  chart.elements.contentContainer.selectAll<SVGGElement, unknown>(".threshold-axis")
                    .call(chart.thresholdAxis))
                .call(line => chart.elements.contentContainer.select<SVGGElement>(`.threshold-indicator-container.${line.datum() > 50 ? "soaring" : "distressed"}`)
                    .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${(line.datum() > 85 && d > 50) || (line.datum() > 15 && d < 50) ? chart.y.scale(line.datum()) + 25 : chart.y.scale(line.datum()) - 15})`)
                    .select("text")
                    .text(Math.round(line.datum())))
        }
        function dragEnd() {
            chart.render()
            d3.select(this).classed("grabbing", false)
            d3.select(this).classed("grab", true)
            if (chart.click) {
                let clickData = chart.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData
                chart.clicking.appendThresholdPercentages(chart, chart.data, clickData)
                _this.timeline.data = [clickData]
                _this.users.data = [clickData]
            } 
            _this.users.thresholds = chart.elements.getThresholdsValues(chart)
        }

        chart.clicking.enableClick(chart, onClick)
        function onClick(e: Event, d: HistogramData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                chart.clicking.removeClick(chart)
                _this.totals.data = chart.data
                _this.timeline.data = chart.data
                _this.users.data = chart.data
                return
            }
            chart.clicking.removeClick(chart)
            chart.click = true
            chart.clicking.appendThresholdPercentages(chart, chart.data, d)
            _this.totals.data = [d]
            _this.timeline.data = [d]
            _this.users.data = [d]
        }

        return chart;
    }
    extendTimeline(dashboard: ExperimentalDashboard) {
        const _this = dashboard
        const chart = _this.timeline

        if (chart.data.length == 0) {
            chart.elements.contentContainer.selectAll(".circle").remove()
            chart.elements.svg.selectAll(".zoom-container").remove()
            chart.elements.contentContainer.selectAll(".click-line").remove()
            chart.elements.zoomSVG = undefined
            chart.elements.zoomFocus = undefined
            return chart
        }

        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton())

        if (_this.histogram.click) {
            d3.select(`#${chart.id} .instructions`)
                .append("span")
                .attr("class", "badge badge-pill badge-info pointer")
                .html(`Users <i class="fas fa-window-close"></i>`)
                .on("click", () => {
                    _this.histogram.clicking.removeClick(_this.histogram)
                    if (_this.barChart.click) {
                        _this.timeline.data = _this.histogram.data
                        _this.users.data = _this.histogram.data
                    } else {
                        _this.handleFilterButton()  
                    }                 
                })
        }

        chart.clicking.enableClick(chart, onClick)
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick(chart)
            _this.users.data = chart.data
        });

        function onClick(e: Event, d: ITimelineData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                if (d3.select(this).attr("class").includes("main")) {
                    chart.clicking.removeClick(chart);
                    _this.users.data = chart.data;
                    return;
                } else {
                    chart.elements.content.classed("main", false);
                }
            }

            chart.clicking.removeClick(chart);
            
            _this.users.data = chart.data;
            chart.click = true;
            chart.elements.content.classed("clicked", (data: IReflectionAuthor) => data.pseudonym == d.pseudonym);
            d3.select(this)
                .classed("main", true);
            
            let groupData = chart.data.find(c => c.group == d.group)
            let usersData = groupData.value.filter(c => c.pseudonym == d.pseudonym).map(c => { 
                return { 
                    "refId": c.refId,
                    "timestamp": c.timestamp,
                    "point": c.point,
                    "text": c.text,
                    "pseudonym": c.pseudonym,
                    "selected": c.refId == d.refId
                } as IReflectionAuthor
            })

            const line = d3.line<IReflectionAuthor>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point))
                .curve(d3.curveMonotoneX)

            chart.elements.contentContainer.append("path")
                .datum(d3.sort(usersData, d => d.timestamp))
                .attr("class", "click-line")
                .attr("d", d => line(d))
                .style("stroke", d.colour);

            //Draw click containers
            usersData.forEach(c => chart.clicking.appendScatterText(chart, c, c.point.toString()));

            _this.users.data = [new AdminAnalyticsData(groupData.group, usersData, groupData.createDate, groupData.colour, groupData.selected)]

            _this.help.removeHelp(chart);
            //Scroll
            document.querySelector("#timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    private removeAllHelp(barChart: ChartSeries) {
        this.help.removeHelp(barChart);
        this.help.removeHelp(this.histogram);
        this.help.removeHelp(this.timeline);
    }
    private getClickData(contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>): unknown {
        if (!contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").empty()) {
            return contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").datum();
        } 
        return;
    };
}

export async function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]) {
    const loading = new Loading();
    const rawData = entriesRaw.map(d => new AdminAnalyticsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map(d => new AdminAnalyticsData(d.group, d.value, d.createDate, colourScale(d.group), true));
    await drawCharts(entries);
    new Tutorial([new TutorialData("#groups", "Add groups to the charts and change their colours"),
    new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#users .bar", "Hover for information on demand or click to compare and drill-down. Other charts will show only the selected group"), 
    new TutorialData("#histogram .threshold-line", "Drag to change the threshold (soaring or distressed) and recalculate the bins"), 
    new TutorialData("#histogram .histogram-rect", "Click to compare the bin with other's group bins"),
    new TutorialData("#timeline-plot", "Swap chart types. Both charts have zoom available"),
    new TutorialData("#timeline .circle", "Hover for information on demand or click to connect the user's reflections")]);
    loading.isLoading = false;
    loading.removeDiv();
    async function drawCharts(allEntries: IAdminAnalyticsData[]) {
        const dashboard = new ExperimentalDashboard(allEntries)
        //Handle sidebar button
        dashboard.sidebarBtn()

        //Preloaded groups
        dashboard.preloadGroups(allEntries)

        //Handle groups chart help
        dashboard.help.helpPopover(dashboard.barChart.id, `<b>Bar chart</b><br>
            A bar chart of the users in each group code<br>
            <u><i>Hover</i></u> over the bars for information on demand<br>
            <u><i>Click</i></u> a bar to compare and drill-down`)

        //Handle users histogram chart help
        dashboard.help.helpPopover(dashboard.histogram.id, `<b>Histogram</b><br>
            A histogram group data points into user-specific ranges. The data points in this histogram are <i>users average reflection point</i>
            <u><i>Hover</i></u> over the boxes for information on demand<br>
            <u><i>Click</i></u> a box to compare<br>
            <u><i>Drag</i></u> the lines to change the thresholds`)

        //Handle timeline chart help
        d3.select("#timeline .card-title button")
            .on("click", function (e: Event) {
                dashboard.help.helpPopover(`${dashboard.timeline.id}-help`, `<b>Scatter plot</b><br>
                    The data is showed as a collection of points<br>The data represented are <i>reflections over time</i><br>
                    <u><i>Hover</i></u> over the circles for information on demand<br>
                    <u><i>Click</i></u> a circle to connect the user's reflections`)
                })
        
        //Handle users histogram chart help
        dashboard.help.helpPopover("reflections", `<b>Reflections</b><br>
            Each user's reflections are shown sorted by time. The chart depicts the percentage of reflections in each reflection point group`)

        //Update charts depending on group
        dashboard.handleGroups();
        dashboard.handleGroupsColours();
        dashboard.handleGroupsSort();
    }
}