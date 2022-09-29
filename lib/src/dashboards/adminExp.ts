import d3 from "d3";
import { ChartSeries, ChartTime, ChartTimeZoom } from "../charts/chartBase.js";
import { IAdminAnalyticsData, IAdminAnalyticsDataStats, AdminAnalyticsDataStats, IHistogramData, IReflectionAuthor, HistogramData, ITimelineData, AdminAnalyticsData } from "../data/data.js";
import { IAdminControlCharts, AdminControlCharts, Dashboard } from "./adminControl.js";
import { AdminExperimentalInteractions } from "../charts/interactions.js";
import { IAdminAnalyticsDataRaw, AdminAnalyticsDataRaw } from "../data/db.js";
import { Loading } from "../utils/loading.js";
import { Tutorial, TutorialData } from "../utils/tutorial.js";
import { Histogram } from "../charts/admin/histogram.js";
import { Sort } from "../interactions/sort.js";
import { Help } from "../charts/help.js";

export interface Idashboard extends IAdminControlCharts {
    barChart: ChartSeries;
    histogram: Histogram;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted: string;
    allEntries: IAdminAnalyticsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    handleGroupsSort(): void;
    handleFilterButton(): void;
}

export class ExperimentalDashboard extends Dashboard {
    entries: IAdminAnalyticsData[]
    sorted = "date"
    sort = new Sort()
    help = new Help()
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
    };
    handleGroups(): void {
        let _this = this;
        let inputs = d3.selectAll("#all-groups input[type=checkbox]")
        inputs.on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let entry = _this.entries.find(d => d.group == target.value)
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
            let data = _this.entries.map(d => new AdminAnalyticsDataStats(d))
            let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsDataStats;
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
    };
    handleGroupsColours(): void {
        let _this = this;
        d3.selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-", "");
            _this.entries.find(d => d.group == groupId).colour = target.value;
            let data = _this.entries.filter(d => d.selected).map(d => new AdminAnalyticsDataStats(d))
            _this.barChart.data = data
            if (_this.barChart.click) {
                let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsDataStats;
                if (clickData.group == groupId) {
                    _this.timeline.data = [_this.entries.find(d => d.group == groupId)];
                    _this.histogram.data = [clickData];
                }
            } else {
                _this.timeline.data = data;
                _this.histogram.data = data
            }
        });
    };
    handleGroupsSort(): void {
        let _this = this;
        d3.select("#sort .btn-group-toggle").on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            _this.entries = _this.entries.sort(function (a, b) {
                if (selectedOption == "date") {
                    return _this.sort.sortData(a.createDate, b.createDate, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "name") {
                    return _this.sort.sortData(a.group, b.group, _this.sorted == "name" ? true : false);
                } else if (selectedOption == "mean") {
                    return _this.sort.sortData(d3.mean(a.value.map(d => d.point)), d3.mean(b.value.map(d => d.point)), _this.sorted == "mean" ? true : false);
                }
            });
            _this.sorted = _this.sort.setSorted(_this.sorted, selectedOption);
            let data = _this.entries.filter(d => d.selected).map(d => new AdminAnalyticsDataStats(d))
            _this.barChart.data = data
            let groupClickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsDataStats;
            if (_this.barChart.click) {              
                _this.barChart.clicking.appendGroupsText(_this.barChart, data, groupClickData);               
            } else {
                _this.histogram.data = data
            }
            _this.removeAllHelp(_this.barChart);
        });
    };
    handleFilterButton(): void {
        let data = this.entries.filter(d => d.selected).map(d => new AdminAnalyticsDataStats(d))
        this.barChart.clicking.removeClick(this.barChart);
        this.histogram.data = data
        this.timeline.data = data
        this.totals.data = data
    };
    constructor(data: IAdminAnalyticsDataStats[]) {
        super(data)
        this.extendBarChart()
    }
    extendBarChart() {
        let _this = this
        _this.barChart.clicking.enableClick(_this.barChart, onClick);
        _this.barChart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.barChart.clicking.removeClick(_this.barChart);
            _this.totals.data = _this.barChart.data
            _this.histogram.data = _this.barChart.data
            _this.timeline.data = _this.barChart.data
        });
        function onClick(e: Event, d: IAdminAnalyticsDataStats) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.barChart.clicking.removeClick(_this.barChart);
                _this.totals.data = _this.barChart.data
                _this.histogram.data = _this.barChart.data
                _this.timeline.data = _this.barChart.data
                return;
            }
            _this.barChart.clicking.removeClick(_this.barChart);
            _this.barChart.click = true;
            _this.barChart.clicking.appendGroupsText(_this.barChart, _this.barChart.data, d);
            _this.totals.data = [d]
            _this.histogram.data = _this.barChart.data.filter(c => c.group == d.group)
            _this.timeline.data = [d]
            _this.removeAllHelp(_this.barChart);
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

export class dashboard extends AdminControlCharts implements Idashboard {
    barChart: ChartSeries;
    histogram: Histogram;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted = "date";
    allEntries: IAdminAnalyticsData[];
    interactions = new AdminExperimentalInteractions();
    preloadGroups(allEntries: IAdminAnalyticsData[]): IAdminAnalyticsData[] {
        super.preloadGroups(allEntries, true)
        this.allEntries = allEntries;

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

        return d3.filter(allEntries, d => d.selected == true);
    };
    handleGroups(): void {
        let _this = this;
        let inputs = d3.selectAll("#all-groups input[type=checkbox]")
        inputs.on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let entry = _this.allEntries.find(d => d.group == target.value)
            if (target.checked) {
                if (entry !== undefined) {
                    entry.selected = true
                } else {
                    _this.allEntries.forEach(c => c.selected = true)
                    inputs.property("checked", true)
                };
            } else {
                if (entry !== undefined) {
                    entry.selected = false
                } else {
                    _this.allEntries.forEach(c => c.selected = false)
                    inputs.property("checked", false)
                };
            }
            let data = _this.getUpdatedData();
            let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsDataStats;
            _this.updateBarChart(_this.barChart, data);
            if (_this.barChart.click) {
                if (!target.checked && target.value == clickData.group) {
                    _this.interactions.click.removeClick(_this.barChart);
                    _this.renderTotals(data);
                    _this.updateTimeline(data);
                    _this.updateHistogram(data.map(d => d.getUsersData()), data.map(d => d.group));
                } else {
                    _this.interactions.click.appendGroupsText(_this.barChart, data, clickData);
                }
            } else {
                _this.renderTotals(data);
                _this.updateTimeline(data);
                _this.updateHistogram(data.map(d => d.getUsersData()), data.map(d => d.group));
            }
            _this.removeAllHelp(_this.barChart);
        });
    };
    handleGroupsColours(): void {
        let _this = this;
        d3.selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-", "");
            _this.allEntries.find(d => d.group == groupId).colour = target.value;
            let data = _this.getUpdatedData();
            _this.renderBarChart(_this.barChart, data);
            if (_this.barChart.click) {
                let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsDataStats;
                if (clickData.group == groupId) {
                    _this.updateTimeline([_this.allEntries.find(d => d.group == groupId)]);
                    _this.updateHistogram([clickData.getUsersData()]);
                }
            } else {
                _this.updateTimeline(data);
                _this.updateHistogram(data.map(d => d.getUsersData()));
            }
        });
    };
    handleGroupsSort(): void {
        let _this = this;
        d3.select("#sort .btn-group-toggle").on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            _this.allEntries = _this.allEntries.sort(function (a, b) {
                if (selectedOption == "date") {
                    return _this.interactions.sort.sortData(a.createDate, b.createDate, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "name") {
                    return _this.interactions.sort.sortData(a.group, b.group, _this.sorted == "name" ? true : false);
                } else if (selectedOption == "mean") {
                    return _this.interactions.sort.sortData(d3.mean(a.value.map(d => d.point)), d3.mean(b.value.map(d => d.point)), _this.sorted == "mean" ? true : false);
                }
            });
            _this.sorted = _this.interactions.sort.setSorted(_this.sorted, selectedOption);
            let data = _this.getUpdatedData();
            _this.interactions.axisSeries(_this.barChart, data);
            let groupClickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsDataStats;
            _this.renderBarChart(_this.barChart, data);
            if (_this.barChart.click) {              
                _this.interactions.click.appendGroupsText(_this.barChart, data, groupClickData);               
            } else {
                _this.updateHistogram(data.map(d => d.getUsersData()), data.map(r => r.group));
            }
            _this.removeAllHelp(_this.barChart);
        });
    };
    handleFilterButton(): void {
        let data = this.getUpdatedData();
        this.interactions.click.removeClick(this.barChart);
        this.updateHistogram(data.map(d => d.getUsersData()), data.map(d => d.group));
        this.updateTimeline(data)
        this.renderTotals(data);
    };
    private getUpdatedData(): IAdminAnalyticsDataStats[] {
        return d3.filter(this.allEntries, d => d.selected).map(d => new AdminAnalyticsDataStats(d));
    };
    private getClickData(contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>): unknown {
        if (!contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").empty()) {
            return contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").datum();
        } 
        return;
    };
    private updateBarChart(chart: ChartSeries, data: IAdminAnalyticsDataStats[]): void {
        if (data.length != 0) {
            chart.y.scale.domain([0, d3.max(data.map(d => d.getStat("usersTotal").value as number))]);
            this.interactions.axisSeries(chart, data);
            this.interactions.axisLinear(chart);
        }       
        this.renderBarChart(chart, data);
    }
    private updateHistogram(data: IAdminAnalyticsData[], scale?: string[]): void {
        if (scale != undefined) {
            this.histogram.x.scale.domain(scale);
        }
        this.renderHistogram(this.histogram, data);
        this.interactions.axisSeries(this.histogram, data);
        if (this.histogram.click) {
            this.interactions.click.removeClick(this.histogram);
        }
    };
    private updateTimeline(data: IAdminAnalyticsData[]): void {
        this.timelineZoom.x.scale.domain([d3.min(data.map(d => d3.min(d.value.map(d => d.timestamp)))), d3.max(data.map(d => d3.max(d.value.map(d => d.timestamp))))]);
        this.interactions.axisTime(this.timeline, data)
        if (this.timeline.elements.contentContainer.selectAll(".contour").empty()) {
            this.renderTimelineScatter(this.timeline, this.timelineZoom, data);
        } else {
            this.renderTimelineDensity(this.timeline, data);
        }
        if (this.timeline.click) {
            this.interactions.click.removeClick(this.timeline);
            this.removeUserStatistics();
        }
        this.handleTimelineButtons(this.timeline, this.timelineZoom, data);
    };
    private removeUserStatistics() {
        d3.select("#reflections .card-title span")
            .html("Users compared to their group");
        d3.select("#reflections .card-subtitle")
            .classed("instructions", true)
            .classed("text-muted", false)
            .html("Select a reflection from the scatter plot to view specific users");
        d3.select("#reflections .users-tab-pane").remove();
    };
    private removeAllHelp(barChart: ChartSeries) {
        this.help.removeHelp(barChart);
        this.help.removeHelp(this.histogram);
        this.help.removeHelp(this.timeline);
    }
    renderBarChart(chart: ChartSeries, data: IAdminAnalyticsDataStats[]): ChartSeries {
        chart = super.renderBarChart(chart, data);
        let _this = this
        _this.interactions.click.enableClick(chart, onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            _this.renderTotals(data);
            _this.updateHistogram(data.map(d => d.getUsersData()), data.map(d => d.group));
            _this.updateTimeline(data);
        });
        function onClick(e: Event, d: IAdminAnalyticsDataStats) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                _this.renderTotals(data);
                _this.updateHistogram(data.map(d => d.getUsersData()), data.map(d => d.group));
                _this.updateTimeline(data);
                return;
            }
            _this.interactions.click.removeClick(chart);
            chart.click = true;
            _this.interactions.click.appendGroupsText(chart, data, d);
            _this.renderTotals([d]);
            _this.updateHistogram([d.getUsersData()], data.filter(c => c.group == d.group).map(d => d.group));
            _this.updateTimeline([d]);
            _this.removeAllHelp(chart);
        }

        return chart;
    };
    renderHistogram(chart: Histogram, data: IAdminAnalyticsData[]): Histogram {
        let _this = this;
        chart = super.renderHistogram(chart, data);

        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton());

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
        });

        //Add drag functions to the distressed threshold
        chart.elements.contentContainer.selectAll(".threshold-line")
            .classed("grab", true)
            .call(d3.drag()
                .on("start", dragStart)
                .on("drag", dragging)
                .on("end", dragEnd));

        //Start dragging functions           
        function dragStart() {
            chart.elements.contentContainer.selectAll(`.${chart.id}-histogram-text-container`).remove();
            d3.select(this).classed("grab", false);
            d3.select(this).classed("grabbing", true);
            _this.help.removeHelp(chart);
        }
        function dragging(e: MouseEvent, d: number) {
            if (d > 50) {
                if (chart.y.scale.invert(e.y) < 51 || chart.y.scale.invert(e.y) > 99) {
                    return;
                }
            } else {
                if (chart.y.scale.invert(e.y) < 1 || chart.y.scale.invert(e.y) > 49) {
                    return;
                }
            }
            
            let thresholds = chart.elements.getThresholdsValues(chart);
            let tDistressed = thresholds[0];
            let tSoaring = thresholds[1];

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
                    .text(Math.round(line.datum())));
        }
        function dragEnd() {
            //chart.setBin();
            _this.interactions.histogram(chart, chart.elements.contentContainer.selectAll(`.${chart.id}-histogram-container`));
            d3.select(this).classed("grabbing", false);
            d3.select(this).classed("grab", true);
            _this.handleHistogramHover(chart);
            if (chart.click) {
                let clickData = chart.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData;
                _this.interactions.click.appendThresholdPercentages(chart, data, clickData);
            } 
            if (chart.id == "histogram" && !_this.timeline.elements.contentContainer.selectAll(".clicked").empty()) {
                let usersData = _this.timeline.elements.contentContainer.selectAll<SVGCircleElement, IReflectionAuthor>(".clicked").datum();
                let binName = _this.getUserStatisticBinName(data.map(d => d.value.find(d => d.pseudonym == usersData.pseudonym))[0], chart.elements.getThresholdsValues(chart));
                d3.select(`#reflections #${usersData.pseudonym} .bin-name`)
                    .attr("class", `bin-name ${binName.toLowerCase()}`)
                    .html(`<b>${binName}</b>`);
            }
        }

        _this.interactions.click.enableClick(chart, onClick);
        function onClick(e: Event, d: HistogramData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                return;
            }
            _this.interactions.click.removeClick(chart);
            chart.click = true;
            _this.interactions.click.appendThresholdPercentages(chart, data, d);
        }

        return chart;
    };
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAdminAnalyticsData[]): ChartTime {
        let _this = this;
        chart = super.renderTimelineScatter(chart, zoomChart, data);

        if (data.length == 0) {
            //Remove scatter plot
            chart.elements.contentContainer.selectAll(".circle").remove();
            chart.elements.svg.selectAll(".zoom-container").remove();
            chart.elements.contentContainer.selectAll(".click-line").remove();
            chart.elements.zoomSVG = undefined;
            chart.elements.zoomFocus = undefined;
            return chart;
        }

        d3.select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton());
        //Enable click
        _this.interactions.click.enableClick(chart, onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            _this.removeUserStatistics();
        });

        function onClick(e: Event, d: ITimelineData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                if (d3.select(this).attr("class").includes("main")) {
                    _this.interactions.click.removeClick(chart);
                    _this.removeUserStatistics();
                    return;
                } else {
                    chart.elements.content.classed("main", false);
                }
            }

            _this.interactions.click.removeClick(chart);
            //Remove users html containers
            _this.removeUserStatistics();
            chart.click = true;
            chart.elements.content.classed("clicked", (data: IReflectionAuthor) => data.pseudonym == d.pseudonym);
            d3.select(this)
                .classed("main", true);
            
            let usersData = data.find(c => c.group == d.group).value.filter(c => c.pseudonym == d.pseudonym);

            let line = d3.line<IReflectionAuthor>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point));

            chart.elements.contentContainer.append("path")
                .datum(d3.sort(usersData, d => d.timestamp))
                .attr("class", "click-line")
                .attr("d", d => line(d))
                .style("stroke", d.colour);

            //Draw click containers
            usersData.forEach(c => _this.interactions.click.appendScatterText(chart, c, c.point.toString()));

            //Draw user statistics container
            d3.select("#reflections .card-title span")
                .html(`User ${d.pseudonym} compared to their group`)
            let userCard = d3.select("#reflections .card-body")
                .append("div")
                .attr("class", "users-tab-pane")
                .attr("id", `reflections-${d.pseudonym}`);
            _this.renderUserStatistics(userCard, data.find(c => c.group == d.group), _this.histogram.elements.getThresholdsValues(_this.histogram), d);

            _this.help.removeHelp(chart);
            //Scroll
            document.querySelector("#timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return chart;
    };
    renderTimelineDensity(chart: ChartTime, data: IAdminAnalyticsData[]): ChartTime {
        chart = super.renderTimelineDensity(chart, data);
        if (data.length == 0) {
            //Remove density plot
            chart.elements.contentContainer.selectAll(".contour").remove();
            return chart;
        }
        d3.select(`#${chart.id} .badge`).on("click", () => this.handleFilterButton());
        this.interactions.click.removeClick(chart);
        return chart;
    };
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAdminAnalyticsData[]): void {
        let _this = this;
        super.handleTimelineButtons(chart, zoomChart, data, newFunc);

        function newFunc(e: any) {
            var selectedOption = e.target.control.value;
            if (selectedOption == "density") {
                if (!chart.elements.contentContainer.selectAll(".click-line").empty()) {
                    _this.removeUserStatistics();
                }
                _this.renderTimelineDensity(chart, data);
            }
            if (selectedOption == "scatter") {
                _this.renderTimelineScatter(chart, zoomChart, data);
            }
            if (!d3.select(`#${chart.id}-help`).empty()) {
                _this.help.removeHelp(chart);
            }
        }
    }
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
        const data = allEntries.map(d => new AdminAnalyticsDataStats(d));
        const dashboard = new ExperimentalDashboard(data);
        //Handle sidebar button
        dashboard.sidebarBtn();

        //Preloaded groups
        dashboard.preloadGroups(allEntries);

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

        //Draw user statistics
        let userStatistics = d3.select("#reflections .card");
        userStatistics.select(".card-subtitle")
            .html("Select a reflection from the scatter plot to view specific users");
        
        //Handle users histogram chart help
        dashboard.help.helpPopover("reflections", `<b>Reflections</b><br>
            Each user's reflections are shown sorted by time. The chart depicts the percentage of reflections in each reflection point group`)

        //Update charts depending on group
        dashboard.handleGroups();
        dashboard.handleGroupsColours();
        dashboard.handleGroupsSort();
    }
}