import { select, selectAll, drag, line, curveMonotoneX, sort } from "d3";
import { IAdminAnalyticsData, IReflectionAuthor, ITimelineData, AdminAnalyticsData } from "../data/data";
import { Dashboard } from "./adminControl";
import { IAdminAnalyticsDataRaw } from "../data/db";
import { Tutorial, TutorialData } from "../utils/tutorial";
import { Sort } from "../interactions/sort";
import { HistogramData, IHistogramData } from "../charts/admin/histogram";

export class ExperimentalDashboard extends Dashboard {
    entries: IAdminAnalyticsData[]
    sort: Sort<IAdminAnalyticsData>
    constructor(entriesRaw: IAdminAnalyticsDataRaw[]) {
        super(entriesRaw)
        this.sort = new Sort("sort-groups", "createDate")
        this.barChart.extend = this.extendBarChart.bind(this)
        this.extendBarChart()
        this.histogram.extend = this.extendHistogram.bind(this)
        this.extendHistogram()
        this.timeline.extend = this.extendTimeline.bind(this)
        this.extendTimeline()
        this.handleGroups()
        this.handleGroupsColours()
        this.handleGroupsSort()
    }
    preloadGroups(entries: IAdminAnalyticsData[]): IAdminAnalyticsData[] {
        super.preloadGroups(entries, true)
        this.entries = entries;

        select("#groups")
            .selectAll<HTMLLIElement, IAdminAnalyticsData>("li").select("div")
            .insert("div", "input")
            .attr("class", "input-group-prepend")
            .append("div")
            .attr("class", "input-group-text group-row h-100")
            .append("input")
            .attr("type", "checkbox")
            .attr("value", d => d.group)
            .property("checked", true)

        return entries.filter(c => c.selected)
    }
    handleGroups(): void {
        const _this = this;
        const inputs = selectAll("#all-groups input[type=checkbox]")
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
                    _this.barChart.clicking.clicked = false
                };
            }
            let data = _this.entries
            let clickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsData;
            _this.barChart.data = data
            if (_this.barChart.clicking.clicked) {
                if (!target.checked && target.value == clickData.group) {
                    _this.barChart.clicking.removeClick()
                    _this.totals.data = data
                    _this.timeline.data = data
                    _this.histogram.data = data
                    _this.users.data = data
                }
            } else {
                _this.totals.data = data
                _this.timeline.data = data
                _this.histogram.data = data
                _this.users.data = data
            }
            _this.removeAllHelp();
        });
    }
    handleGroupsColours(): void {
        const _this = this;
        selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-", "");
            _this.entries.find(d => d.group == groupId).colour = target.value;
            let data = _this.entries.filter(d => d.selected)
            _this.barChart.data = data
            if (_this.barChart.clicking.clicked) {
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
        selectAll(`#${id} .btn-group label`).on("click", function (this: HTMLLabelElement) {
            const selectedOption = (this.control as HTMLInputElement).value
            _this.sort.sortBy = selectedOption
            _this.entries = _this.sort.sortData(_this.entries)
            let data = _this.entries.filter(d => d.selected)
            let groupClickData = _this.getClickData(_this.barChart.elements.contentContainer) as IAdminAnalyticsData
            _this.barChart.data = data
            if (_this.barChart.clicking.clicked) {              
                _this.barChart.elements.content.classed("clicked", (d: IAdminAnalyticsData) => d.group === groupClickData.group)            
            } else {
                _this.histogram.data = data
                _this.users.data = data
            }
            _this.removeAllHelp();
        });
    }
    private handleFilterButton(): void {
        const data = this.entries.filter(d => d.selected)
        this.barChart.clicking.removeClick()
        this.histogram.clicking.removeClick()
        this.histogram.data = data
        this.timeline.data = data
        this.totals.data = data
        this.users.data = data
    }
    extendBarChart() {
        const _this = this
        const chart = _this.barChart

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick()
            _this.histogram.clicking.removeClick()
            _this.totals.data = chart.data
            _this.histogram.data = chart.data
            _this.timeline.data = chart.data
            _this.users.data = chart.data
        });
        const onClick = function(e: Event, d: IAdminAnalyticsData) {
            if (select(this).attr("class").includes("clicked")) {
                chart.clicking.removeClick()
                _this.totals.data = chart.data
                _this.histogram.data = chart.data
                _this.timeline.data = chart.data
                _this.users.data = chart.data
                return
            }
            chart.clicking.removeClick()
            select(this)
                .classed("clicked", true)
            chart.clicking.clicked = true
            _this.totals.data = [d]
            _this.histogram.data = chart.data.filter(c => c.group == d.group)
            _this.timeline.data = [d]
            _this.users.data = [d]
            _this.removeAllHelp()
        }
        chart.clicking.enableClick(onClick)
    }
    extendHistogram() {
        const _this = this
        const chart = _this.histogram

        select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton())

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick()
            _this.totals.data = chart.data
            _this.timeline.data = chart.data
            _this.users.data = chart.data
        });

        //Start dragging functions           
        const dragStart = function() {
            chart.elements.contentContainer.selectAll(`.${chart.id}-histogram-text-container`).remove()
            select(this).classed("grab", false)
            select(this).classed("grabbing", true)
            chart.help.removeHelp()
        }
        const dragging = function(e: MouseEvent, d: number) {
            if (d > 50) {
                if (chart.y.scale.invert(e.y) < 51 || chart.y.scale.invert(e.y) > 99) {
                    return
                }
            } else {
                if (chart.y.scale.invert(e.y) < 1 || chart.y.scale.invert(e.y) > 49) {
                    return
                }
            }
            
            let thresholds = chart.elements.getThresholdsValues(chart.x, chart.y)
            let tDistressed = thresholds[0]
            let tSoaring = thresholds[1]

            select<SVGLineElement, number>(this)
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
        const dragEnd = function() {
            chart.render()
            select(this).classed("grabbing", false)
            select(this).classed("grab", true)
            if (chart.clicking.clicked) {
                let clickData = chart.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData
                chart.clicking.appendThresholdPercentages(chart.data, clickData)
                _this.timeline.data = [clickData]
                _this.users.data = [clickData]
            } 
            _this.users.thresholds = chart.elements.getThresholdsValues(chart.x, chart.y)
        }
        //Add drag functions to the distressed threshold
        chart.elements.contentContainer.selectAll(".threshold-line")
            .classed("grab", true)
            .call(drag()
                .on("start", dragStart)
                .on("drag", dragging)
                .on("end", dragEnd))

        const onClick = function(e: Event, d: HistogramData) {
            if (select(this).attr("class").includes("clicked")) {
                chart.clicking.removeClick()
                _this.totals.data = chart.data
                _this.timeline.data = chart.data
                _this.users.data = chart.data
                return
            }
            chart.clicking.removeClick()
            chart.clicking.clicked = true
            chart.clicking.appendThresholdPercentages(chart.data, d)
            _this.totals.data = [d]
            _this.timeline.data = [d]
            _this.users.data = [d]
        }
        chart.clicking.enableClick(onClick)
    }
    extendTimeline() {
        const _this = this
        const chart = _this.timeline

        if (chart.data.length == 0) {
            chart.elements.contentContainer.selectAll(".circle").remove()
            chart.elements.svg.selectAll(".zoom-container").remove()
            chart.elements.contentContainer.selectAll(".click-line").remove()
            chart.elements.zoomSVG = undefined
            chart.elements.zoomFocus = undefined
        }

        select(`#${chart.id} .badge`).on("click", () => _this.handleFilterButton())

        if (_this.histogram.clicking.clicked) {
            select(`#${chart.id} .instructions`)
                .append("span")
                .attr("class", "badge rounded-pill bg-info pointer")
                .html(`Users ${_this.histogram.clicking.clickedBin} <i class="fas fa-window-close"></i>`)
                .on("click", () => {
                    _this.histogram.clicking.removeClick()
                    if (_this.barChart.clicking.clicked) {
                        _this.timeline.data = _this.histogram.data
                        _this.users.data = _this.histogram.data
                    } else {
                        _this.handleFilterButton()  
                    }                 
                })
        }

        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            chart.clicking.removeClick()
            _this.users.data = chart.data
        });

        const onClick = function(this: SVGCircleElement, e: MouseEvent, d: ITimelineData) {
            if (select(this).attr("class").includes("clicked")) {
                if (select(this).attr("class").includes("main")) {
                    chart.clicking.removeClick()
                    _this.users.data = chart.data
                    return
                } else {
                    chart.elements.content.classed("main", false)
                }
            }

            chart.clicking.removeClick();
            
            _this.users.data = chart.data;
            chart.clicking.clicked = true;
            chart.elements.content.filter((data: IReflectionAuthor) => data.pseudonym == d.pseudonym)
                .classed("clicked", true)
                .attr("r", 10)
            chart.elements.content.classed("not-clicked", (data: IReflectionAuthor) => data.pseudonym != d.pseudonym)
            select(this)
                .classed("main", true)
                .attr("r", 15)
            
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

            const refLine = line<IReflectionAuthor>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point))
                .curve(curveMonotoneX)

            chart.elements.contentContainer.append("path")
                .datum(sort(usersData, d => d.timestamp))
                .attr("class", "click-line")
                .attr("d", d => refLine(d))
                .style("stroke", d.colour);

            //Draw click containers
            usersData.forEach(c => chart.clicking.appendScatterText(c, c.point.toString()));

            _this.users.data = [new AdminAnalyticsData(groupData.group, usersData, groupData.createDate, groupData.colour, groupData.selected)]

            chart.help.removeHelp();
            //Scroll
            document.querySelector(".reflection-selected").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        chart.clicking.enableClick(onClick)
    }
    private removeAllHelp() {
        this.barChart.help.removeHelp();
        this.histogram.help.removeHelp();
        this.timeline.help.removeHelp();
    }
    private getClickData(contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>): unknown {
        if (!contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").empty()) {
            return contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").datum();
        } 
        return;
    };
}

export async function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]) {
    const dashboard = new ExperimentalDashboard(entriesRaw)
    //Handle sidebar button
    dashboard.sidebarBtn()

    //Handle groups chart help
    dashboard.barChart.help.helpPopover(`<b>Bar chart</b><br>
        A bar chart of the users in each group code<br>
        <u><i>Hover</i></u> over the bars for information on demand<br>
        <u><i>Click</i></u> a bar to compare and drill-down`)

    //Handle users histogram chart help
    dashboard.histogram.help.helpPopover(`<b>Histogram</b><br>
        A histogram group data points into user-specific ranges. The data points in this histogram are <i>users average reflection point</i><br>
        <u><i>Hover</i></u> over the boxes for information on demand<br>
        <u><i>Click</i></u> a box to compare and drill-down<br>
        <u><i>Drag</i></u> the lines to change the thresholds`)

    //Handle timeline chart help
    dashboard.timeline.help.helpPopover(`<b>Scatter plot</b><br>
        The data is showed as a collection of points<br>The data represented are <i>reflections over time</i><br>
        <u><i>Hover</i></u> over the circles for information on demand<br>
        <u><i>Click</i></u> a circle to connect the user's reflections and drill-down`)
    
    //Handle users histogram chart help
    dashboard.users.help.helpPopover(`<b>Reflections</b><br>
        Each user's reflections are shown by group. The chart depicts the user's average reflection point<br>
        <u><i>Sort</i></u> by user's name or average reflection state point`)
    
    // new Tutorial([new TutorialData("#groups", "Add groups to the charts and change their colours"),
    // new TutorialData("#sort-groups .sort-by", "Sort groups by creation date, name or users' reflection point average"),
    // new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
    // new TutorialData("#users .bar", "Hover for information on demand or click to compare and drill-down. Other charts will show only the selected group"), 
    // new TutorialData("#histogram .threshold-line", "Drag to change the threshold (soaring or distressed) and recalculate the bins"), 
    // new TutorialData("#histogram .histogram-rect", "Click to compare the bin with other's group bins and drill-down"),
    // new TutorialData("#timeline .zoom-buttons", "Click to zoom in and out. To pan the chart click, hold and move left or right in any blank area"),
    // new TutorialData("#timeline .circle", "Hover for information on demand or click to connect the user's reflections"),
    // new TutorialData("#reflections .sort-by", "Sort users alphabetically or by their average reflection state point")])
}