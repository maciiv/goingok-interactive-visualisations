import * as d3 from "d3";

interface IAnalyticsChartsData {
    group: string,
    value: IReflectionAuthorEntry[]
}

interface IReflectionAuthorEntry {
    timestamp: Date,
    pseudonym: string,
    point: number,
    text: string
}

interface IMetatagsAnalytics extends IPhraseTagsAnalytics {
    phraseTags: IPhraseTagsAnalytics[]
}

interface IPhraseTagsAnalytics {
    tag: string,
    value: number
}

interface IAnalyticsChartsDataStats extends IAnalyticsChartsData {
    mean: number,
    median: number,
    q1: number,
    q3: number,
    max: number,
    min: number,
    variance: string,
    deviation: string,
    oldestReflection: Date,
    newestReflection: Date,
    avgReflectionsPerUser: string,
    userMostReflective: number,
    userLessReflective: number,
    totalUsers: number
}

class Chart implements IChart {
    id: string;
    width: number;
    height: number;
    x: IChartAxis;
    y: IChartAxis;
    renderElements = new ChartRenderElements();
    padding: IChartPadding = { xAxis: 50, yAxis: 75, top: 25, right: 0 };
    click: false;
    private basicChart(id: string): Chart {
        let result = new Chart();

        result.id = id;
        let containerDimensions = d3.select(`#${id} .chart-container`).node().getBoundingClientRect();       
        result.width = containerDimensions.width;
        result.height = containerDimensions.height;

        result.y = new ChartAxis("State", [0, 100], [result.height - result.padding.xAxis - result.padding.top, 0], "left");

        return result;
    };
    setChart(id: string, data: IAnalyticsChartsData[]): Chart {
        let result = this.basicChart(id);
        result.x = new ChartAxis("Group Code", data.map(r => r.group), [0, result.width - result.padding.yAxis - result.padding.right], "bottom");

        return result;
    };
    setTimelineChart(id: string, data: IReflectionAuthorEntry[]): Chart {
        let result = this.basicChart(id);

        result.padding.xAxis = result.padding.xAxis + 25;
        result.padding.top = 5;

        result.x = new ChartAxis("Time", d3.extent(data.map(r => r.timestamp)), [0, result.width - result.padding.yAxis], "bottom");

        return result;
    };
    setTimelineZoomChart(chart: IChart, data: IReflectionAuthorEntry[]): Chart {
        let result = new Chart();
        result.x = new ChartAxis("", d3.extent(data.map(r => r.timestamp)), [0, chart.width - chart.padding.yAxis - 5], "bottom");
        result.y = new ChartAxis("", [0, 100], [25, 0], "left");
        return result;
    }
}

interface IChart {
    id: string;
    width: number;
    height: number;
    x: IChartAxis;
    y: IChartAxis;
    renderElements: IChartRenderElements;
    padding: IChartPadding;
    click: boolean;
    setChart(id: string, data: IAnalyticsChartsData[]): Chart;
    setTimelineChart(id: string, data: IReflectionAuthorEntry[]): Chart;
    setTimelineZoomChart(chart: IChart, data: IReflectionAuthorEntry[]): Chart;
}

class ChartAxis implements IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    sorted: boolean;
    constructor(label: string, domain: string[] | number[] | Date[], range: number[], position: string){
        this.label = label;

        switch(typeof domain[0]) {
            case "string":
                this.scale = d3.scaleBand()
                .domain(domain as string[])
                .rangeRound(range)
                .padding(0.25);
                break;
            case "number":
                this.scale = d3.scaleLinear()
                .domain(domain as number[])
                .range(range);
                break;
            default:
                this.scale = d3.scaleTime()
                .domain(domain as Date[])
                .range(range);
        }

        this.axis = this.positionAxis(position, this.scale);
        if (typeof domain == "number"){
            let labels: Map<number | d3.AxisDomain, string> = new Map();
            labels.set(0, "distressed");
            labels.set(50, "going ok");
            labels.set(100, "soaring");

            this.axis.tickValues([0, 25, 50, 75, 100])
                .tickFormat((d: d3.AxisDomain, i:number) => labels.get(d));
        };
    };
    setThresholdAxis(chart: IChart, tDistressed: number, tSoaring: number) {
        return d3.axisRight(chart.y.scale as d3.ScaleLinear<number, number, never>)
            .tickValues([tDistressed, tSoaring])
            .tickFormat((d: number) => d == tDistressed ? "Distressed" : d == tSoaring ? "Soaring" : "");
    };
    private positionAxis(position: string, scale: any) {
        if (position == "left") {
            return d3.axisLeft(scale);
        }
        else if (position == "top") {
            return d3.axisTop(scale);
        }
        else if (position == "bottom") {
            return d3.axisBottom(scale);
        }
        else if (position == "right") {
            return d3.axisRight(scale);
        }
    }
}

interface IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    sorted: boolean;
    setThresholdAxis(chart: IChart, tDistressed: number, tSoaring: number): d3.Axis<d3.NumberValue>;
}

class ChartRenderElements implements IChartRenderElements {
    svg: any;
    contentContainer: any;
    content: any;
    xAxis: any;
    yAxis: any;
    zoomSVG: any;
    zoomFocus: any;
    preRender(chart: IChart): void {
        chart.renderElements.svg = this.appendSVG(chart);
        chart.renderElements.contentContainer = this.appendContentContainer(chart);
        chart.renderElements.xAxis = this.appendXAxis(chart);
        this.appendXAxisLabel(chart);
        this.appendYAxis(chart);
        this.appendYAxisLabel(chart);
    }
    appendSVG(chart: IChart): d3.Selection<d3.BaseType, unknown, HTMLElement, any> {
        return d3.select(`#${chart.id}`)
            .select(".chart-container")
            .append("svg")
            .attr("id", `chart-${chart.id}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${chart.width} ${chart.height}`);
    };
    appendContentContainer(chart: IChart) {
        let result = chart.renderElements.svg.append("g")
            .attr("class", "content-container")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.padding.top})`)
            .attr("clip-path", `url(#clip-${chart.id})`);

        result.append("rect")
            .attr("class", "zoom-rect")
            .attr("width", chart.width - chart.padding.yAxis - chart.padding.right)
            .attr("height", chart.height - chart.padding.xAxis - chart.padding.top);

        result.append("clipPath")
            .attr("id", `clip-${chart.id}`)
            .append("rect")
            .attr("x", 1)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("height", chart.height - chart.padding.xAxis - chart.padding.top);

        return result;
    };
    appendXAxis(chart: IChart) {
        return chart.renderElements.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - chart.padding.xAxis})`)
            .attr("class", "x-axis")
            .attr("clip-path", `url(#clip-${chart.id})`)
            .call(chart.x.axis);
    };
    appendXAxisLabel(chart: IChart) {
        return chart.renderElements.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (chart.renderElements.svg.select(".x-axis").node().getBBox().width / 2 + chart.padding.yAxis) + ", " + (chart.height - chart.padding.xAxis + chart.renderElements.svg.select(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(chart.x.label);
    };
    appendYAxis(chart: IChart) {
        return chart.renderElements.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.padding.top})`)
            .attr("class", "y-axis")
            .call(chart.y.axis);
    };
    appendYAxisLabel(chart: IChart) {
        return chart.renderElements.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (chart.padding.yAxis - chart.renderElements.svg.select(".y-axis").node().getBBox().width) + ", " + (chart.padding.top + chart.renderElements.svg.select(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(chart.y.label);
    };
    appendThresholdAxis(chart: IChart, axis: any) {
        return chart.renderElements.contentContainer.append("g")
            .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right}, 0)`)
            .attr("class", "threshold-axis")
            .call(axis);
    };
    appendThresholdLabel(chart: IChart) {
        let label = chart.renderElements.svg.append("g")
            .attr("class", "threshold-label-container")
        label.append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text("Thresholds");
        label.attr("transform", `translate(${chart.width - chart.padding.right + chart.renderElements.contentContainer.select(".threshold-axis").node().getBBox().width + label.node().getBBox().height}, ${chart.padding.top + chart.renderElements.svg.select(".y-axis").node().getBBox().height / 2}) rotate(-90)`);

        return label;
    };
    appendThresholdIndicators(chart: IChart, thresholds: number[]): void {
        let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;
        thresholds.forEach((c, i) => {
            let indicator = chart.renderElements.contentContainer.append("g")
                .attr("class", `threshold-indicator-container ${i == 0 ? "distressed" : "soaring"}`)
                .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${yScale(c) + 25})`);
            let box = indicator.append("rect")
                .attr("class", `threshold-indicator-box ${i == 0 ? "distressed" : "soaring"}`);
            let text = indicator.append("text")
                .attr("class", "threshold-indicator-text")
                .attr("x", 5)
                .text(c);
            box.attr("width", text.node().getBBox().width + 10)
                .attr("height", text.node().getBBox().height + 5)
                .attr("y", -text.node().getBBox().height);
        });
    }   
}

interface IChartRenderElements {
    svg: any;
    contentContainer: any;
    content: any;
    xAxis: any;
    yAxis: any;
    zoomSVG: any;
    zoomFocus: any;
    preRender(chart: IChart): void;
    appendSVG(chart: IChart): d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    appendContentContainer(chart: IChart): any;
    appendXAxis(chart: IChart): any;
    appendXAxisLabel(chart: IChart): any;
    appendYAxis(chart: IChart): any;
    appendYAxisLabel(chart: IChart): any;
    appendThresholdAxis(chart: IChart, axis: any): any;
    appendThresholdLabel(chart: IChart): any;
    appendThresholdIndicators(chart: IChart, thresholds: number[]): void;
}

interface IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
}

interface ITooltipValues {
    label: string,
    value: number
}

interface IBinData {
    bin: number[],
    percentage: number
}

class HtmlContainers implements IHtmlContainers {
    groupsChart: any;
    groupStatistics: any;
    groupTimeline: any;
    groupViolin: any;
    userViolin: any;
    compare: any;
    userStatistics: any;
    reflections: any;
    remove() {
        this.groupStatistics.remove();
        this.groupTimeline.remove();
        this.groupViolin.remove();
        this.userViolin.remove();
        this.compare.remove();
    };
    removeUsers() {
        this.userStatistics.remove();
        this.reflections.remove();
    };
    appendDiv(id: string, css: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        return d3.select("#analytics-charts").append("div")
            .attr("id", id)
            .attr("class", css);
    };
    appendCard(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, header: string, id?: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        let card = div.append("div")
            .attr("class", "card")
        card.append("div")
            .attr("class", "card-header")
            .html(header);
        card.append("div")
            .attr("class", "card-body chart-container");
        if (id != null) {
            card.attr("id", id);
        }
        return card;
    };
}

interface IHtmlContainers {
    groupsChart: any,
    groupStatistics: any,
    groupTimeline: any,
    groupViolin: any,
    userViolin: any,
    compare: any
    userStatistics: any;
    reflections: any;
    remove(): void;
    removeUsers(): void;
    appendDiv(id: string, css: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    appendCard(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, header: string, id?: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
}

export function buildControlAdminAnalyticsCharts(entries: IAnalyticsChartsData[]){
    //Handle sidebar button
    sidebarFunctions.sidebarBtn();

    function drawCharts(entries: IAnalyticsChartsData[]){
        let htmlContainer = new HtmlContainers();
        let selectedGroups: string[] = [];

        //Append groups chart container
        htmlContainer.groupsChart = htmlContainer.appendDiv("groups-chart", "col-md-9");
        htmlContainer.appendCard(htmlContainer.groupsChart, "Reflections box plot by group");

        //Create data with current entries
        let data = chartFunctions.data.processEntries(entries);

        //Create group chart with current data
        let groupChart = new Chart().setChart("groups-chart", data);

        adminAnalyticsCharts.renderGroupChart(groupChart, data);
    }
}

export function buildExperimentAdminAnalyticsCharts(entries: IAnalyticsChartsData[]) {
    //Handle sidebar button
    sidebarFunctions.sidebarBtn();

    //Draw charts
    drawCharts(entries);

    function drawCharts(allEntries: IAnalyticsChartsData[]) {
        let htmlContainer = new HtmlContainers();

        let selectedGroups: string[] = [];

        //Preloaded groups
        preloadGroups();
        function preloadGroups() {
            d3.selectAll("#groups input").each(function () {
                d3.select(this).attr("checked") == null ? "" : selectedGroups.push(d3.select(this).attr("value"));
            });

            //Process entries to be drawn
            entries = d3.filter(allEntries, (d: IAnalyticsChartsData) => selectedGroups.includes(d.group));
        };

        //Handle add or remove groups
        addRemoveGroups();
        function addRemoveGroups() {
            d3.selectAll("#groups input").on("change", (e: any) => {
                if (e.target.checked) {
                    //Add group code to the list
                    selectedGroups.push(e.target.value);

                    //Update data
                    updateData();

                    //Handle there is an active click in the group chart
                    if (groupChart.click) {
                        //Update click text
                        chartFunctions.click.appendGroupsText(groupChart, data, data[data.map(d => d.group).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))]);

                        //Update group compare inputs
                        groupCompare(data, htmlContainer.groupStatistics.select(".card").attr("id"));
                    }
                }
                else {
                    //Remove group code from the list
                    selectedGroups.splice(selectedGroups.indexOf(e.target.value), 1);

                    //Update data
                    updateData();

                    //Remove clicks that are not in the list
                    groupChart.renderElements.contentContainer.selectAll(`#${groupChart.id} .content-container .click-container`)
                        .data(data)
                        .exit()
                        .remove();

                    //Handle there is an active click in the group chart
                    if (groupChart.click) {
                        //Handle if the removed code group was clicked
                        if (e.target.value == htmlContainer.groupStatistics.select(".card").attr("id")) {
                            //Remove click
                            chartFunctions.click.removeClick(groupChart);

                            //Remove click class
                            chartFunctions.click.removeClickClass(groupChart, "bar");

                            //Remove drilldown html containers
                            htmlContainer.remove();

                            //If users html containers exists remove them
                            if (htmlContainer.userStatistics != undefined) {
                                //Remove users html containers
                                htmlContainer.removeUsers();
                            }
                        }
                        else {
                            //Update click text
                            chartFunctions.click.appendGroupsText(groupChart, data, data[data.map(d => d.group).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))]);

                            //Update group compare inputs
                            let currentCompareGroups = groupCompare(data, htmlContainer.groupStatistics.select(".card").attr("id"));

                            //Remove removed group code from the compare groups
                            currentCompareGroups.splice(currentCompareGroups.indexOf(e.target.value), 1);

                            //Update violin data
                            let violinData = d3.filter(allEntries, (d: IAnalyticsChartsData) => currentCompareGroups.includes(d.group)) as IAnalyticsChartsData[];

                            //Update violin chart series scale
                            violinChart.x = new ChartAxis("Group Code", violinData.map(r => r.group), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right], "bottom");

                            //Update violin users chart series scale
                            violinUsersChart.x = new ChartAxis("Group Code", violinData.map(r => r.group), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right], "bottom");

                            //Render violin with updated data
                            renderViolin(violinChart, violinData);

                            //Render violin users with updated data
                            renderViolin(violinUsersChart, violinData);

                            //Transition violin series
                            chartFunctions.transitions.axis(violinChart, violinData);

                            //Transition violin users series
                            chartFunctions.transitions.axis(violinUsersChart, violinData);
                        }
                    }
                }
            });

            function updateData() {
                //Update entries with the new group code list
                entries = d3.filter(allEntries, (d: IAnalyticsChartsData) => selectedGroups.includes(d.group)) as IAnalyticsChartsData[];

                //Update data with the updated entries
                data = chartFunctions.data.processEntries(entries);

                //Update group chart series scale
                groupChart.x = new ChartAxis("Group Code", data.map(r => r.group), [0, groupChart.width - groupChart.padding.yAxis - groupChart.padding.right], "bottom");

                //Transition group chart series
                chartFunctions.transitions.axis(groupChart, data);

                //Render group chart with updated data
                renderGroupChart(groupChart, data);
            }
        }

        //Append groups chart container
        htmlContainer.groupsChart = htmlContainer.appendDiv("groups-chart", "col-md-9");
        htmlContainer.appendCard(htmlContainer.groupsChart, "Reflections box plot by group");

        //Create data with current entries
        let data = chartFunctions.data.processEntries(entries);

        //Create group chart with current data
        let groupChart = new Chart().setChart("groups-chart", data);

        //Render svg, containers, standard axis and labels
        groupChart.renderElements.preRender(groupChart);
        renderGroupChart(groupChart, data);

        function renderGroupChart(chart: IChart, data: IAnalyticsChartsDataStats[]) {
            //Set scale types
            let xScale = chart.x.scale as d3.ScaleBand<string>;
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            //Select existing minMax lines
            let minMax = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data-min-max`)
                .data(data);

            //Remove old minMax lines
            minMax.exit().remove();

            //Append new minMax lines
            let minMaxEnter = minMax.enter()
                .append("line")
                .attr("id", `${chart.id}-data-min-max`)
                .attr("class", "box-line")
                .attr("x1", (d: IAnalyticsChartsDataStats) => xScale(d.group) + (xScale.bandwidth() / 2))
                .attr("x2", (d: IAnalyticsChartsDataStats) => xScale(d.group) + (xScale.bandwidth() / 2))
                .attr("y1", (d: IAnalyticsChartsDataStats) => yScale(d.min))
                .attr("y2", (d: IAnalyticsChartsDataStats) => yScale(d.max));

            //Merge existing and new minMax lines
            minMax.merge(minMaxEnter);

            //Select existing median lines
            let median = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data-median`)
                .data(data);

            //Remove old median lines
            median.exit().remove();

            //Append new median lines
            let medianEnter = median.enter()
                .append("line")
                .attr("id", `${chart.id}-data-median`)
                .attr("class", "box-line")
                .attr("x1", (d: IAnalyticsChartsDataStats) => xScale(d.group))
                .attr("x2", (d: IAnalyticsChartsDataStats) => xScale(d.group) + xScale.bandwidth())
                .attr("y1", (d: IAnalyticsChartsDataStats) => yScale(d.median))
                .attr("y2", (d: IAnalyticsChartsDataStats) => yScale(d.median));

            //Merge existing and new median lines
            median.merge(medianEnter);

            //Select existing boxes
            let boxes = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data`)
                .data(data);

            //Remove old boxes
            boxes.exit().remove();

            //Append new boxes
            let boxesEnter = boxes.enter()
                .append("rect")
                .attr("id", `${chart.id}-data`)
                .classed("bar", true)
                .attr("y", (d: IAnalyticsChartsDataStats) => yScale(d.q3))
                .attr("x", (d: IAnalyticsChartsDataStats) => xScale(d.group))
                .attr("width", (d: IAnalyticsChartsDataStats) => xScale.bandwidth())
                .attr("height", (d: IAnalyticsChartsDataStats) => yScale(d.q1) - yScale(d.q3));

            //Merge existing and new boxes
            boxes.merge(boxesEnter);

            //Transition boxes and lines
            chartFunctions.transitions.bars(chart, data);

            //Set render elements content to boxes
            chart.renderElements.content = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data`);

            //Enable tooltip
            chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
            function onMouseover(e: any, d: IAnalyticsChartsDataStats): void {
                //If box is clicked not append tooltip
                if (d3.select(this).attr("class").includes("clicked")) {
                    return;
                }

                //Append tooltip box with text
                let tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, d.group, [{ label: "q1", value: d.q1 }, { label: "q3", value: d.q3 }, { label: "Median", value: d.median }, { label: "Mean", value: d.mean }, { label: "Max", value: d.max }, { label: "Min", value: d.min }]);

                //Position tooltip container
                chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.q3, tooltipBox));
                function xTooltip(x: string, tooltipBox: any) {
                    //Position tooltip right of the box
                    let xTooltip = xScale(x) + xScale.bandwidth();

                    //If tooltip does not fit position left of the box
                    if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                        return xTooltip - xScale.bandwidth() - tooltipBox.node().getBBox().width;
                    }

                    return xTooltip
                }
                function yTooltip(y: number, tooltipBox: any) {
                    //Position tooltip on top of the box
                    let yTooltip = yScale(y) - (tooltipBox.node().getBBox().height / 2);

                    //If tooltip does not fit position at the same height as the box
                    if (yScale.invert(yTooltip) < 0) {
                        return yScale(y + yScale.invert(yTooltip));
                    }
                    return yTooltip;
                }
            }
            function onMouseout(): void {
                //Transition tooltip to opacity 0
                chart.renderElements.svg.select(".tooltip-container").transition()
                    .style("opacity", 0);

                //Remove tooltip
                chartFunctions.tooltip.removeTooltip(chart);
            }

            //Enable click
            chartFunctions.click.enableClick(chart, onClick);
            function onClick(e: Event, d: IAnalyticsChartsDataStats) {
                //If box is clicked remove click         
                if (d3.select(this).attr("class") == "bar clicked") {
                    //Remove click
                    chartFunctions.click.removeClick(chart);

                    //Remove click class
                    d3.select(this).attr("class", "bar");

                    //Remove drilldown html containers
                    htmlContainer.remove();

                    //If users html containers exists remove them
                    if (htmlContainer.userStatistics != undefined) {
                        //Remove users html containers
                        htmlContainer.removeUsers();
                    }
                    return;
                }

                //Remove existing click
                chartFunctions.click.removeClick(chart);

                //Remove existing click classes
                chartFunctions.click.removeClickClass(chart, "bar");

                //If drilldown html containers exists remove them
                if (htmlContainer.groupStatistics != undefined) {
                    //Remove drilldown html containers
                    htmlContainer.remove();
                }

                //If users html containers exists remove them
                if (htmlContainer.userStatistics != undefined) {
                    //Remove users html containers
                    htmlContainer.removeUsers();
                }

                //Set chat click to true
                chart.click = true;

                //Append click text
                chartFunctions.click.appendGroupsText(chart, data, d);

                //Show selected group general statistics
                htmlContainer.groupStatistics = htmlContainer.appendDiv("groups-statistics", "col-md-3");
                let groupsStatisticsCard = htmlContainer.appendCard(htmlContainer.groupStatistics, `Statitics (${d.group})`, d.group);
                groupsStatisticsCard.select(".card-body")
                    .attr("class", "card-body statistics-text")
                    .html(`<b>Q1: </b>${d.q1}<br>
                        <b>Median: </b>${d.median}<br>
                        <b>Q3: </b>${d.q3}<br>
                        <b>Mean: </b>${d.mean}<br>
                        <b>Total Reflections: </b>${d.value.length}<br>
                        <b>Variance: </b>${d.variance}<br>
                        <b>Std Deviation: </b>${d.deviation}<br>
                        <b>Max: </b>${d.max}<br>
                        <b>Min: </b>${d.min}<br>
                        <b>Reflections per user: </b>${d.avgReflectionsPerUser}<br>
                        <b>Max reflections per user: </b>${d.userMostReflective}<br>
                        <b>Min reflections per user: </b>${d.userLessReflective}<br>
                        <b>Total Users: </b>${d.totalUsers}<br>
                        <b>Oldest reflection</b><br>${d.oldestReflection.toDateString()}<br>
                        <b>Newest reflection</b><br>${d.newestReflection.toDateString()}<br>`);

                //Draw compare
                htmlContainer.compare = htmlContainer.appendDiv("group-compare", "col-md-2 mt-3");
                let compareCard = htmlContainer.appendCard(htmlContainer.compare, `Compare ${d.group} with:`);
                compareCard.select(".card-body").attr("class", "card-body");
                let currentCompareGroups = groupCompare(data, d.group);

                //Draw groups violin container  
                htmlContainer.groupViolin = htmlContainer.appendDiv("group-violin-chart", "col-md-5 mt-3");
                htmlContainer.appendCard(htmlContainer.groupViolin, `Reflections distribution (${d.group})`);

                //Draw users violin container
                htmlContainer.userViolin = htmlContainer.appendDiv("group-violin-users-chart", "col-md-5 mt-3");
                htmlContainer.appendCard(htmlContainer.userViolin, `Users distribution (${d.group})`);

                //Draw violins              
                groupViolinChart(data, currentCompareGroups);

                //Draw selected group timeline 
                htmlContainer.groupTimeline = htmlContainer.appendDiv("group-timeline", "col-md-12 mt-3");
                let timelineCard = htmlContainer.appendCard(htmlContainer.groupTimeline, `Reflections vs Time (${d.group})`);
                timelineCard.select(".card-body")
                    .attr("class", "card-body")
                    .html(`<div class="row">
                        <div id="timeline-plot" class="btn-group btn-group-toggle mr-auto ml-auto" data-toggle="buttons">
                            <label class="btn btn-light active">
                                <input type="radio" name="plot" value="density" checked>Density Plot<br>
                            </label>
                            <label class="btn btn-light">
                                <input type="radio" name="plot" value="scatter">Scatter Plot<br>
                            </label>
                        </div>
                    </div>`)
                    .append("div")
                    .attr("class", "chart-container");
                groupTimeline(d);

                //Scroll
                document.querySelector("#groups-statistics").scrollIntoView({ behavior: 'smooth', block: 'start' });
            }


            //Enable sort
            let sortButton = chart.renderElements.svg.select(".y-label-container").attr("class", "y-label-container zoom");
            let yArrow = chartFunctions.sort.appendArrow(sortButton, chart, false, true);
            sortButton.on("click", function () {
                chart.y.sorted = chart.y.sorted == false ? true : false;
                chartFunctions.sort.arrowTransition(chart.renderElements.svg, chart, yArrow, false, true);
                data = data.sort(function (a, b) {
                    return chartFunctions.sort.sortData(a.mean, b.mean, chart.y.sorted);
                });

                chartFunctions.transitions.axis(chart, data);
                chartFunctions.transitions.bars(chart, data);
                if (chart.click) {
                    chartFunctions.click.appendGroupsText(chart, data, data[data.map(d => d.group).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))])
                }
            });
        }

        function groupTimeline(data: IAnalyticsChartsDataStats) {
            let timelineChart = new Chart().setTimelineChart("group-timeline", data.value);
            timelineChart.renderElements.preRender(timelineChart);
            renderTimelineDensity(timelineChart, data.value);
            let timelineZoomChart = new Chart().setTimelineZoomChart(timelineChart, data.value);

            d3.select("#group-timeline #timeline-plot").on("click", (e: any) => {
                var selectedOption = e.target.control.value;
                if (selectedOption == "density") {
                    //If users html containers exists remove them
                    if (htmlContainer.userStatistics != undefined) {
                        //Remove users html containers
                        htmlContainer.removeUsers();
                    }
                    renderTimelineDensity(timelineChart, data.value);
                }
                if (selectedOption == "scatter") {
                    renderTimelineScatter(timelineChart, timelineZoomChart, data.value, data);
                }
            });

            function renderTimelineDensity(chart: IChart, data: IReflectionAuthorEntry[]) {
                //Set scale types
                let xScale = chart.x.scale as d3.ScaleTime<number, number, never>;
                let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

                //Remove scatter plot
                chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-circles`).remove();
                chart.renderElements.svg.selectAll(".zoom-container").remove();

                //Remove click
                chartFunctions.click.removeClick(chart);
                chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();

                //Create density data
                let densityData = createDensityData(xScale);
                
                function createDensityData(xScale: d3.ScaleTime<number, number, never>){
                    return d3.contourDensity<IReflectionAuthorEntry>()
                    .x((d: IReflectionAuthorEntry) => xScale(d.timestamp))
                    .y((d: IReflectionAuthorEntry) => yScale(d.point))
                    .bandwidth(5)
                    .thresholds(20)
                    .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])
                    (data);
                }

                //Draw contours
                chart.renderElements.content = chart.renderElements.contentContainer.selectAll(`${chart.id}-timeline-contours`)
                    .data(densityData)
                    .enter()
                    .append("path")
                    .attr("id", `${chart.id}-timeline-contours`)
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())
                    .attr("stroke", (d: any) => d3.interpolateBlues(d.value * 25))
                    .attr("fill", (d: any) => d3.interpolateBlues(d.value * 20));

                //Enable zoom
                chartFunctions.zoom.enableZoom(chart, zoomed);
                function zoomed(e: any) {
                    let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
                    xScale.rangeRound(newChartRange);

                    let newDensityData = createDensityData(xScale);

                    let zoomContours = chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-contours`)
                        .data(newDensityData);

                    zoomContours.exit().remove();

                    let zoomContoursEnter = zoomContours.enter()
                        .append("path")
                        .attr("id", `${chart.id}-timeline-contours`)
                        .attr("class", "contour")
                        .attr("d", d3.geoPath())
                        .attr("stroke", (d: any) => d3.interpolateBlues(d.value * 25))
                        .attr("fill", (d: any) => d3.interpolateBlues(d.value * 20));

                    zoomContours.attr("d", d3.geoPath())
                        .attr("stroke", (d: any) => d3.interpolateBlues(d.value * 25))
                        .attr("fill", (d: any) => d3.interpolateBlues(d.value * 20));

                    zoomContours.merge(zoomContoursEnter);

                    chart.x.axis.ticks(newChartRange[1] / 75);
                    chart.renderElements.xAxis.call(chart.x.axis);
                }
            }

            function renderTimelineScatter(chart: IChart, zoomChart: IChart, data: IReflectionAuthorEntry[], stats: IAnalyticsChartsDataStats) {
                //Set scale types
                let xScale = chart.x.scale as d3.ScaleTime<number, number, never>;
                let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;
                
                //Remove density plot
                chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-contours`).remove();

                //Draw circles
                chart.renderElements.content = chart.renderElements.contentContainer.selectAll(`${chart.id}-timeline-circles`)
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("line-circle", true)
                    .attr("id", `${chart.id}-timeline-circles`)
                    .attr("r", 5)
                    .attr("cx", (d: IReflectionAuthorEntry) => xScale(d.timestamp))
                    .attr("cy", (d: IReflectionAuthorEntry) => yScale(d.point));

                //Enable tooltip
                chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
                function onMouseover(e: any, d: IReflectionAuthorEntry) {
                    if (d3.select(this).attr("class").includes("clicked")) {
                        return;
                    }
                    let tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, (d.timestamp as Date).toDateString(), [{ label: "State", value: d.point as number }]);
                    chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.timestamp as Date, tooltipBox), yTooltip(d.point as number, tooltipBox));

                    function xTooltip(x: Date, tooltipBox: any) {
                        let xTooltip = xScale(x);
                        if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                            return xTooltip - tooltipBox.node().getBBox().width;
                        }
                        return xTooltip
                    };

                    function yTooltip(y: number, tooltipBox: any) {
                        var yTooltip = yScale(y) - tooltipBox.node().getBBox().height - 10;
                        if (yTooltip < 0) {
                            return yTooltip + tooltipBox.node().getBBox().height + 20;
                        }
                        return yTooltip;
                    };

                    chartFunctions.tooltip.appendLine(chart, 0, yScale(d.point), xScale(d.timestamp), yScale(d.point));
                    chartFunctions.tooltip.appendLine(chart, xScale(d.timestamp), yScale(0), xScale(d.timestamp), yScale(d.point));
                }
                function onMouseout() {
                    chart.renderElements.svg.select(".tooltip-container").transition()
                        .style("opacity", 0);
                    chartFunctions.tooltip.removeTooltip(chart);
                }

                //Enable click
                chartFunctions.click.enableClick(chart, onClick);
                function onClick(e: any, d: IReflectionAuthorEntry) {
                    if (d3.select(this).attr("class") == "line-circle clicked") {
                        chartFunctions.click.removeClick(chart);
                        chart.renderElements.content.attr("class", "line-circle");
                        chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
                        htmlContainer.removeUsers();
                        return;
                    }

                    chartFunctions.click.removeClick(chart);
                    chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
                    //If users html containers exists remove them
                    if (htmlContainer.userStatistics != undefined) {
                        //Remove users html containers
                        htmlContainer.removeUsers();
                    }
                    chart.renderElements.content.attr("class", (data: IReflectionAuthorEntry) => `line-circle ${data.pseudonym == d.pseudonym ? "clicked" : ""}`);
                    let userData = data.filter(c => c.pseudonym == d.pseudonym);

                    let line = d3.line<IReflectionAuthorEntry>()
                        .x((d: IReflectionAuthorEntry) => xScale(d.timestamp))
                        .y((d: IReflectionAuthorEntry) => yScale(d.point));

                    chart.renderElements.contentContainer.append("path")
                        .datum(d3.sort(userData, (d: IReflectionAuthorEntry) => d.timestamp))
                        .classed("line", true)
                        .attr("id", `${chart.id}-timeline-circles-line`)
                        .attr("d", (d: IReflectionAuthorEntry[]) => line(d));

                    //Draw click containers
                    userData.forEach(c => chartFunctions.click.appendText(chart, c, c.point.toString()));

                    //Draw user statistics container
                    htmlContainer.userStatistics = htmlContainer.appendDiv("user-statistics", "col-md-3 mt-3");
                    let userStatisticsCard = htmlContainer.appendCard(htmlContainer.userStatistics, `${d.pseudonym}'s statistics`);
                    let userMean = Math.round(d3.mean(userData.map(r => r.point)));
                    userStatisticsCard.select(".card-body")
                        .attr("class", "card-body statistics-text")
                        .html(`<b>Mean: </b>${userMean} (<span class="${(userMean - stats.mean) < 0 ? "negative" : "positive"}">${(userMean - stats.mean) < 0 ? "" : "+"}${userMean - stats.mean}</span> compared to the group mean)<br>
                            <b>Min: </b>${d3.min(userData.map(r => r.point))}<br>
                            <b>Min date: </b>${((d3.sort(userData, (r: IReflectionAuthorEntry) => r.point)[0] as IReflectionAuthorEntry).timestamp).toDateString()}<br>
                            <b>Max: </b>${d3.max(userData.map(r => r.point))}<br>
                            <b>Max date: </b>${((d3.sort(userData, (r: IReflectionAuthorEntry) => r.point)[userData.length - 1] as IReflectionAuthorEntry).timestamp).toDateString()}<br>
                            <b>Total: </b>${userData.length}<br>
                            <b>Std Deviation: </b>${chartFunctions.data.roundDecimal(d3.deviation(userData.map(r => r.point)))}<br>
                            <b>Variance: </b>${chartFunctions.data.roundDecimal(d3.variance(userData.map(r => r.point)))}<br>
                            <b>Oldest reflection: </b>${(d3.min(userData.map(r => r.timestamp))).toDateString()}<br>
                            <b>Newest reflection: </b>${(d3.max(userData.map(r => r.timestamp ))).toDateString()}<br>`);

                    //Draw user reflections container
                    htmlContainer.reflections = htmlContainer.appendDiv("reflections-list", "col-md-9 mt-3");
                    let reflectionsCard = htmlContainer.appendCard(htmlContainer.reflections, `${d.pseudonym}'s reflections`);
                    let reflectionsCardText: string = "";
                    d3.sort(userData, (r: IReflectionAuthorEntry) => r.timestamp).forEach((c: IReflectionAuthorEntry) => {
                        reflectionsCardText = reflectionsCardText + `<p><b>${c.timestamp.toDateString()} - State: ${c.point}</b><br>${c.text}</p>`
                    })
                    reflectionsCard.select(".card-body")
                        .attr("class", "card-body statistics-text")
                        .html(reflectionsCardText);

                    //Scroll
                    document.querySelector("#group-timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                //Append zoom bar
                chart.renderElements.zoomSVG = chartFunctions.zoom.appendZoomBar(chart);
                chart.renderElements.zoomFocus = chart.renderElements.zoomSVG.append("g")
                    .attr("class", "zoom-focus");

                //Set zoom scale types
                let zoomXScale = zoomChart.x.scale as d3.ScaleTime<number, number, never>;
                let zoomYScale = zoomChart.y.scale as d3.ScaleLinear<number, number, never>;

                //Draw in zoom bar
                chart.renderElements.zoomSVG.selectAll(chart.id + "zoom-bar-content")
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("zoom-line-circle", true)
                    .attr("id", chart.id + "zoom-bar-content")
                    .attr("r", 2)
                    .attr("cx", (d: IReflectionAuthorEntry) => zoomXScale(d.timestamp))
                    .attr("cy", (d: IReflectionAuthorEntry) => zoomYScale(d.point));

                //Draw hidden content that will handle the borders
                chart.renderElements.zoomFocus.selectAll(chart.id + "zoom-content")
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("zoom-content", true)
                    .attr("id", chart.id + "zoom-bar-content")
                    .attr("r", 2)
                    .attr("cx", (d: IReflectionAuthorEntry) => zoomXScale(d.timestamp))
                    .attr("cy", (d: IReflectionAuthorEntry) => zoomYScale(d.point));

                //Enable zoom
                chartFunctions.zoom.enableZoom(chart, zoomed);
                function zoomed(e: any) {
                    let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
                    xScale.rangeRound(newChartRange);
                    zoomXScale.rangeRound([0, chart.width - chart.padding.yAxis - 5].map(d => e.transform.invertX(d)));
                    let newLine = d3.line<IReflectionAuthorEntry>()
                        .x((d: IReflectionAuthorEntry) => xScale(d.timestamp))
                        .y((d: IReflectionAuthorEntry) => yScale(d.point));

                    chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-circles`)
                        .attr("cx", (d: IReflectionAuthorEntry) => xScale(d.timestamp));

                    chart.renderElements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`)
                        .attr("d", (d: IReflectionAuthorEntry[]) => newLine(d));

                    chart.renderElements.contentContainer.selectAll(".click-container")
                        .attr("transform", (d: IReflectionAuthorEntry) => `translate(${xScale(d.timestamp)}, ${yScale(d.point)})`)

                    chart.renderElements.zoomFocus.selectAll(".zoom-content")
                        .attr("cx", (d: IReflectionAuthorEntry) => zoomXScale(d.timestamp));

                    chart.x.axis.ticks(newChartRange[1] / 75);
                    chart.renderElements.xAxis.call(chart.x.axis);
                }
            }
        }

        //Global variables for the violin chart
        let violinChart: IChart;
        let violinUsersChart: IChart;
        let thresholdAxis: any;

        function groupViolinChart(data: IAnalyticsChartsData[], groups: string[]) {
            let groupData = d3.filter(data, (d: IAnalyticsChartsData) => groups.includes(d.group));
            let currentData = [] as IAnalyticsChartsData[];
            groupData.forEach((c: IAnalyticsChartsData) => {
                let userMean = Array.from(d3.rollup(c.value, (d: IReflectionAuthorEntry[]) => Math.round(d3.mean(d.map(r => r.point))), (d: IReflectionAuthorEntry) => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
                currentData.push({ group: c.group, value: userMean });
            });

            violinChart = new Chart().setChart("group-violin-chart", groupData);
            violinChart.padding.right = 85;
            violinChart.x = new ChartAxis("Group Code", groupData.map(r => r.group), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right], "bottom");
            violinChart.renderElements.preRender(violinChart);
            renderViolinThresholds(violinChart, groupData, 30, 70);
            renderViolin(violinChart, groupData);

            violinUsersChart = new Chart().setChart("group-violin-users-chart", currentData);
            violinUsersChart.padding.right = 85;
            violinUsersChart.x = new ChartAxis("Group Code", groupData.map(r => r.group), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right], "bottom");
            violinUsersChart.renderElements.preRender(violinUsersChart);
            renderViolinThresholds(violinUsersChart, currentData, 30, 70);
            renderViolin(violinUsersChart, currentData);

            function renderViolinThresholds(chart: IChart, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
                //Create threshold axis
                thresholdAxis = chart.y.setThresholdAxis(chart, tDistressed, tSoaring);

                //Draw threshold axis
                chart.renderElements.appendThresholdAxis(chart, thresholdAxis);

                //Draw threshold indicators
                chart.renderElements.appendThresholdIndicators(chart, [tDistressed, tSoaring]);

                //Draw threshold label
                chart.renderElements.appendThresholdLabel(chart);

                //Draw threshold lines
                chartFunctions.drag.appendThresholdLine(chart, [tDistressed, tSoaring]);
            }
        }

        function renderViolin(chart: IChart, data: IAnalyticsChartsData[]) {
            //Set scale types
            let xScale = chart.x.scale as d3.ScaleBand<string>;
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            let thresholds = chartFunctions.drag.getThresholdsValues(chart);
            let tDistressed = thresholds[0];
            let tSoaring = thresholds[1];

            dragViolinThresholds(chart, data, tDistressed, tSoaring);
            drawViolin(chart, data, tDistressed, tSoaring);

            function dragViolinThresholds(chart: IChart, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
                //Add drag functions to the distressed threshold
                chart.renderElements.contentContainer.select(".threshold-line.distressed")
                    .call(d3.drag()
                        .on("start", dragStartDistressed)
                        .on("drag", draggingDistressed)
                        .on("end", dragEndDistressed));

                //Add drag functions to the soaring threshold
                chart.renderElements.contentContainer.select(".threshold-line.soaring")
                    .call(d3.drag()
                        .on("start", dragStartSoaring)
                        .on("drag", draggingSoaring)
                        .on("end", dragEndSoaring));

                //Start drag soaring functions           
                function dragStartSoaring(e: any, d: IAnalyticsChartsData) {
                    chart.renderElements.contentContainer.selectAll(`.${chart.id}-violin-text-container`).remove();
                    d3.select(this).attr("class", d3.select(this).attr("class") + " grabbing")
                }
                function draggingSoaring(e: any, d: IAnalyticsChartsData) {
                    if (yScale.invert(e.y) < 51 || yScale.invert(e.y) > 99) {
                        return;
                    }
                    d3.select(this)
                        .attr("y1", yScale(yScale.invert(e.y)))
                        .attr("y2", yScale(yScale.invert(e.y)));

                    tSoaring = yScale.invert(e.y);
                    thresholdAxis.tickValues([tDistressed, yScale.invert(e.y)])
                        .tickFormat((d: number) => d == tDistressed ? "Distressed" : d == yScale.invert(e.y) ? "Soaring" : "");

                    chart.renderElements.contentContainer.selectAll(".threshold-axis")
                        .call(thresholdAxis);

                    let positionX = chart.width - chart.padding.yAxis - chart.padding.right + 5;
                    let positionY = yScale(tSoaring) + 25;
                    let indicator = chart.renderElements.contentContainer.select(".threshold-indicator-container.soaring");
                    if (positionY + indicator.node().getBBox().height > yScale(tDistressed)) {
                        positionY = yScale(tSoaring) - 15;
                    }
                    indicator.attr("transform", `translate(${positionX}, ${positionY})`);
                    indicator.select("text")
                        .text(Math.round(tSoaring));

                }
                function dragEndSoaring(e: any, d: IAnalyticsChartsData) {
                    let newT = yScale.invert(e.y);
                    if (newT < 51) {
                        newT = 51;
                    }
                    if (newT > 99) {
                        newT = 99;
                    }
                    chartFunctions.transitions.violin(chart, data, tDistressed, newT);
                    d3.select(this).attr("class", d3.select(this).attr("class").replace(" grabbing", ""));
                }

                //Start drag distressed functions
                function dragStartDistressed(e: any, d: IAnalyticsChartsData) {
                    chart.renderElements.contentContainer.selectAll(`.${chart.id}-violin-text-container`).remove();
                    d3.select(this).attr("class", d3.select(this).attr("class") + " grabbing");
                }
                function draggingDistressed(e: any, d: IAnalyticsChartsData) {
                    if (yScale.invert(e.y) < 1 || yScale.invert(e.y) > 49) {
                        return;
                    }
                    d3.select(this)
                        .attr("y1", yScale(yScale.invert(e.y)))
                        .attr("y2", yScale(yScale.invert(e.y)));

                    tDistressed = yScale.invert(e.y);
                    thresholdAxis.tickValues([yScale.invert(e.y), tSoaring])
                        .tickFormat((d: number) => d == yScale.invert(e.y) ? "Distressed" : d == tSoaring ? "Soaring" : "");

                    chart.renderElements.contentContainer.selectAll(".threshold-axis")
                        .call(thresholdAxis);

                    let soaringIndicator = chart.renderElements.contentContainer.select(".threshold-indicator-container.soaring");
                    if (yScale(tDistressed) < yScale(tSoaring) + soaringIndicator.node().getBBox().height + 25) {
                        soaringIndicator.attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${yScale(tSoaring) - 15})`);
                    } else {
                        soaringIndicator.attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${yScale(tSoaring) + 25})`);
                    }

                    let indicator = chart.renderElements.contentContainer.select(".threshold-indicator-container.distressed")
                        .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${yScale(tDistressed) + 25})`)
                    indicator.select("text")
                        .text(Math.round(tDistressed));
                }
                function dragEndDistressed(e: any, d: IAnalyticsChartsData) {
                    let newT = yScale.invert(e.y);
                    if (newT < 1) {
                        newT = 1;
                    }
                    if (newT > 49) {
                        newT = 49;
                    }
                    chartFunctions.transitions.violin(chart, data, newT, tSoaring);
                    d3.select(this).attr("class", d3.select(this).attr("class").replace(" grabbing", ""));
                }
            }

            function drawViolin(chart: IChart, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
                //Set scale types
                let xScale = chart.x.scale as d3.ScaleBand<string>;
                let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

                //Create bandwidth scale
                let bandwithScale = d3.scaleLinear()
                    .range([0, xScale.bandwidth()])
                    .domain([-d3.max(data.map(r => r.value.length)), d3.max(data.map(r => r.value.length))]);

                //Create bins             
                let bin = d3.bin().domain([0, 100]).thresholds([0, tDistressed, tSoaring]);

                //Select existing bin containers
                let binContainer = chart.renderElements.contentContainer.selectAll(`.${chart.id}-violin-container`)
                    .data(data);

                //Remove old bin containers
                binContainer.exit().remove();

                //Append new bin containers
                let binContainerEnter = binContainer.enter()
                    .append("g")
                    .attr("class", `${chart.id}-violin-container`)
                    .attr("transform", (d: IAnalyticsChartsData) => `translate(${xScale(d.group)}, 0)`);

                //Draw violins
                binContainerEnter.append("path")
                    .attr("id", `${chart.id}-violin`)
                    .attr("class", "violin-path")
                    .datum((d: IAnalyticsChartsData) => bin(d.value.map(d => d.point)))
                    .attr("d", d3.area()
                        .x0((d: number[]) => bandwithScale(-d.length))
                        .x1((d: number[]) => bandwithScale(d.length))
                        .y((d: number[], i: number) => yScale(i == 0 ? 0 : i == 1 ? 50 : 100))
                        .curve(d3.curveCatmullRom));

                //Transision bin containers
                binContainer.transition()
                    .duration(750)
                    .attr("transform", (d: IAnalyticsChartsData) => `translate(${xScale(d.group)}, 0)`);

                //Merge existing with new bin containers
                binContainer.merge(binContainerEnter);

                //Transition violins
                chartFunctions.transitions.violin(chart, data, tDistressed, tSoaring);
            }
        }

        function groupCompare(data: IAnalyticsChartsData[], group: string) {
            let currentGroups: string[] = [];

            //Check active groups
            d3.selectAll("#group-compare input").each(function () {
                d3.select(this).property("checked") == null ? "" : currentGroups.push(d3.select(this).attr("value"));
            });

            //Remove groups html
            d3.select("#group-compare .card-body").html("");

            //Select card body
            let container = d3.select("#group-compare .card-body");

            //Append group inputs
            data.map(r => r.group).forEach((d: string) => {
                //If current d is the selected group skip rendering input
                if (d == group) {
                    return
                }

                //Render input
                container.html(container.html() + `<div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="${d}" id="compare-${d}" ${currentGroups.includes(d) ? "checked" : ""} />
                                    <label class="form-check-label" for="compare-${d}">${d}</label>
                                </div>`)
            });

            //Handle change group inputs
            d3.selectAll("#group-compare input").on("change", (e: any) => {
                if (e.target.checked) {
                    currentGroups.push(e.target.value);
                }
                else {
                    currentGroups.splice(currentGroups.indexOf(e.target.value), 1);
                }

                let groupData = d3.filter(data, (d: IAnalyticsChartsData) => currentGroups.includes(d.group));
                let currentData = [] as IAnalyticsChartsData[];
                groupData.forEach((c: IAnalyticsChartsData) => {
                    let userMean = Array.from(d3.rollup(c.value, (d: IReflectionAuthorEntry[]) => Math.round(d3.mean(d.map(r => r.point))), (d: IReflectionAuthorEntry) => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
                    currentData.push({ group: c.group, value: userMean });
                });

                violinChart.x = new ChartAxis("Group Code", groupData.map(r => r.group), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right], "bottom");
                violinUsersChart.x = new ChartAxis("Group Code", groupData.map(r => r.group), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right], "bottom");
                chartFunctions.transitions.axis(violinChart, groupData);
                chartFunctions.transitions.axis(violinUsersChart, groupData);

                renderViolin(violinChart, groupData);
                renderViolin(violinUsersChart, groupData);
            });

            currentGroups.push(group);
            return currentGroups;

        }
    }
}

var sidebarFunctions = {
    sidebarBtn: function () {
        let sidebarWidth = d3.select("#sidebar").node().getBoundingClientRect().width;
        d3.select("#sidebar")
            .style("width", `${sidebarWidth}px`);

        //Handle side bar btn click
        d3.select("#sidebar-btn").on("click", (e: any) => {
            let isActive = d3.select("#sidebar").attr("class") == "active";
            d3.select("#sidebar")
                .attr("class", isActive ? "" : "active")
                .style("margin-left", isActive ? `${66 - sidebarWidth}px` : "");
            d3.select("#sidebar #groups")
                .style("opacity", isActive ? "0" : "1")
        });
    }
};

var chartFunctions = {    
    data: {
        processEntries: function (entries: IAnalyticsChartsData[]) {
            let result = [] as IAnalyticsChartsDataStats[]
            entries.forEach(c => {
                let uniqueUsers = Array.from(d3.rollup(c.value, (d: IReflectionAuthorEntry[]) => d.length, (d: IReflectionAuthorEntry) => d.pseudonym), ([key, value]) => ({ key, value }));
                result.push({
                    value: c.value.map(r => { return { timestamp: new Date(r.timestamp), point: r.point, pseudonym: r.pseudonym, text: r.text } }),
                    group: c.group,
                    mean: Math.round(d3.mean(c.value.map(r => r.point))),
                    median: d3.median(c.value.map(r => r.point)),
                    q1: d3.quantile(c.value.map(r => r.point), 0.25),
                    q3: d3.quantile(c.value.map(r => r.point), 0.75),
                    max: d3.max(c.value.map(r => r.point)),
                    min: d3.min(c.value.map(r => r.point)),
                    variance: chartFunctions.data.roundDecimal(d3.variance(c.value.map(r => r.point))),
                    deviation: chartFunctions.data.roundDecimal(d3.deviation(c.value.map(r => r.point))),
                    oldestReflection: d3.min(c.value.map(r => new Date(r.timestamp))),
                    newestReflection: d3.max(c.value.map(r => new Date(r.timestamp))),
                    avgReflectionsPerUser: chartFunctions.data.roundDecimal(d3.mean(uniqueUsers.map(r => r.value))),
                    userMostReflective: d3.max(uniqueUsers.map(r => r.value)),
                    userLessReflective: d3.min(uniqueUsers.map(r => r.value)),
                    totalUsers: uniqueUsers.length
                })
            });
            return result;
        },
        roundDecimal: function (value: number) {
            let p = d3.precisionFixed(0.1);
            let f = d3.format("." + p + "f");
            return f(value);
        }
    },
    tooltip: {
        enableTooltip: function (chart: IChart, onMouseover: any, onMouseout: any) {
            this.appendTooltipContainer(chart);

            chart.renderElements.content.on("mouseover", onMouseover)
                .on("mouseout", onMouseout);
        },
        appendTooltipContainer: function (chart: IChart) {
            chart.renderElements.contentContainer.selectAll(".tooltip-container").remove();
            return chart.renderElements.contentContainer.append("g")
                .attr("class", "tooltip-container");
        },
        appendTooltipText: function (chart: IChart, title: string, values: ITooltipValues[] = null) {
            let result = chart.renderElements.contentContainer.select(".tooltip-container").append("rect")
                .attr("class", "tooltip-box");

            let text = chart.renderElements.contentContainer.select(".tooltip-container").append("text")
                .attr("class", "tooltip-text title")
                .attr("x", 10)
                .text(title);

            let textSize = text.node().getBBox().height
            text.attr("y", textSize);

            if (values != null) {
                values.forEach((c, i) => {
                    text.append("tspan")
                        .attr("class", "tooltip-text")
                        .attr("y", textSize * (i + 2))
                        .attr("x", 15)
                        .text(`${c.label}: ${c.value}`);
                });
            }

            chart.renderElements.contentContainer.select(".tooltip-box").attr("width", text.node().getBBox().width + 20)
                .attr("height", text.node().getBBox().height + 5);

            return result;
        },
        appendLine: function (chart: IChart, x1: number, y1: number, x2: number, y2: number) {
            chart.renderElements.contentContainer.append("line")
                .attr("class", "tooltip-line")
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2);
        },
        positionTooltipContainer: function (chart: IChart, x: number, y: number) {
            chart.renderElements.contentContainer.select(".tooltip-container")
                .attr("transform", `translate(${x}, ${y})`)
                .transition()
                .style("opacity", 1);
        },
        removeTooltip: function (chart: IChart) {
            chart.renderElements.contentContainer.selectAll(".tooltip-box").remove();
            chart.renderElements.contentContainer.selectAll(".tooltip-text").remove();
            chart.renderElements.contentContainer.selectAll(".tooltip-line").remove();
        }
    },
    sort: {
        appendArrow: function (button: any, chart: IChart, x: boolean = false, y: boolean = false) {
            return button.append("polygon")
                .attr("class", "sort-arrow")
                .attr("points", this.arrowPoints(button, chart, x, y));
        },
        arrowPoints: function (svg: any, chart: IChart, x: boolean, y: boolean) {
            let selector = x == true ? ".x-label-text" : ".y-label-text";
            let height = svg.select(selector).node().getBBox().height;
            let width = svg.select(selector).node().getBBox().width;
            let point1 = [(width / 2) + 5, 0];
            let point2 = [(width / 2) + 5, -height / 2];
            let point3 = [(width / 2) + 15, -height / 4];

            if ((x == true && chart.x.sorted == false) || (y == true && chart.y.sorted == false)) {
                point1 = [-(width / 2) - 5, 0];
                point2 = [-(width / 2) - 5, -height / 2];
                point3 = [-(width / 2) - 15, -height / 4];
            }

            return point1 + ", " + point2 + ", " + point3;
        },
        setSorted: function (chart: IChart, x: boolean = false, y: boolean = false) {
            if (x == true && chart.x.sorted == true) {
                return chart.x.sorted = false;
            }
            else if (x == true && chart.x.sorted == false) {
                return chart.x.sorted = true;
            }
            else if (y == true && chart.y.sorted == true) {
                chart.y.sorted = false;
            }
            else if (y == true && chart.y.sorted == false) {
                chart.y.sorted = true;
            }
        },
        arrowTransition: function (svg: any, chart: IChart, arrow: any, x: boolean = false, y: boolean = false) {
            svg.select(".sort-arrow.active")
                .attr("class", "sort-arrow")
            arrow.transition()
                .attr("points", this.arrowPoints(svg, chart, x, y))
                .attr("class", "sort-arrow active");
        },
        sortData: function (a: number, b: number, sorted: boolean) {
            if (a < b) {
                if (sorted) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
            if (a > b) {
                if (sorted) {
                    return 1;
                }
                else {
                    return -1;
                }
            }
            return 0;
        }
    },
    click: {
        enableClick: function (chart: IChart, onClick: any) {
            chart.renderElements.content.on("click", onClick)
        },
        removeClick: function (chart: IChart) {
            chart.click = false;
            chart.renderElements.contentContainer.selectAll(".click-text").remove();
            chart.renderElements.contentContainer.selectAll(".click-line").remove();
            chart.renderElements.contentContainer.selectAll(".click-container").remove();
        },
        removeClickClass: function (chart: IChart, css: string) {
            d3.selectAll(`#${chart.id} .content-container .${css}`)
                .attr("class", css)
        },
        appendText: function (chart: IChart, d: IReflectionAuthorEntry, title: string, values: ITooltipValues[] = null) {
            let container = chart.renderElements.contentContainer.append("g")
                .datum(d)
                .attr("class", "click-container");

            let box = container.append("rect")
                .attr("class", "click-box");

            let text = container.append("text")
                .attr("class", "click-text title")
                .attr("x", 10)
                .text(title);

            let textSize = text.node().getBBox().height
            text.attr("y", textSize);

            if (values != null) {
                values.forEach((c, i) => {
                    text.append("tspan")
                        .attr("class", "click-text")
                        .attr("y", textSize * (i + 2))
                        .attr("x", 15)
                        .text(`${c.label}: ${c.value}`);
                });
            }

            box.attr("width", text.node().getBBox().width + 20)
                .attr("height", text.node().getBBox().height + 5)
                .attr("clip-path", `url(#clip-${chart.id})`);

            container.attr("transform", this.positionClickContainer(chart, box, text, d));
        },
        positionClickContainer: function (chart: IChart, box: any, text: any, d: IReflectionAuthorEntry) {
            //Set scale types
            let xScale = chart.x.scale as d3.ScaleTime<number, number, never>;
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            let positionX = xScale(d.timestamp);
            let positionY = yScale(d.point) - box.node().getBBox().height - 10;
            if (chart.width - chart.padding.yAxis < xScale(d.timestamp) + text.node().getBBox().width) {
                positionX = xScale(d.timestamp) - box.node().getBBox().width;
            };
            if (yScale(d.point) - box.node().getBBox().height - 10 < 0) {
                positionY = positionY + box.node().getBBox().height + 20;
            };
            return `translate(${positionX}, ${positionY})`;
        },
        appendGroupsText: function (chart: IChart, data: IAnalyticsChartsDataStats[], clickData: IAnalyticsChartsDataStats) {
            //Set scale types
            let xScale = chart.x.scale as d3.ScaleBand<string>;
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            chart.renderElements.contentContainer.selectAll(".click-container text").remove();

            chart.renderElements.content.attr("class", (d: IAnalyticsChartsDataStats) => d.group == clickData.group ? "bar clicked" : "bar");

            let clickContainer = chart.renderElements.contentContainer.selectAll(".click-container")
                .data(data);
            clickContainer.enter()
                .append("g")
                .merge(clickContainer)
                .attr("class", "click-container")
                .attr("transform", (c: IAnalyticsChartsDataStats) => `translate(${xScale(c.group) + xScale.bandwidth() / 2}, 0)`);
            clickContainer.exit().remove();

            chart.renderElements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[0])
                .attr("y", (c: IAnalyticsChartsDataStats) => yScale(c.q3) - 5)
                .text((c: IAnalyticsChartsDataStats) => `q3: ${this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[1]}`);
            chart.renderElements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.median, c.median, clickData.group, c.group)[0])
                .attr("y", (c: IAnalyticsChartsDataStats) => yScale(c.median) - 5)
                .text((c: IAnalyticsChartsDataStats) => `Median: ${this.comparativeText(clickData.median, c.median, clickData.group, c.group)[1]}`);
            chart.renderElements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[0])
                .attr("y", (c: IAnalyticsChartsDataStats) => yScale(c.q1) - 5)
                .text((c: IAnalyticsChartsDataStats) => `q1: ${this.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[1]}`);
        },
        comparativeText: function (clickValue: number, value: number, clickXValue: string | Date, xValue: string | Date) {
            let textClass = "click-text";
            let textSymbol = "";
            if (clickValue - value < 0) {
                textClass = textClass + " positive";
                textSymbol = "+";
            }
            else if (clickValue - value > 0) {
                textClass = textClass + " negative";
                textSymbol = "-";
            }
            else {
                textClass = textClass + " black"
            }
            return [textClass, `${textSymbol}${clickXValue == xValue ? clickValue : (Math.abs(clickValue - value))}`];
        }
    },
    zoom: {
        enableZoom: function (chart: IChart, zoomed: any) {
            chart.renderElements.svg.selectAll(".zoom-rect")
                .attr("class", "zoom-rect active");

            let zoom = d3.zoom()
                .scaleExtent([1, 5])
                .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
                .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
                .on("zoom", zoomed);

            chart.renderElements.contentContainer.select(".zoom-rect").call(zoom);
        },
        appendZoomBar: function (chart: IChart) {
            return chart.renderElements.svg.append("g")
                .attr("class", "zoom-container")
                .attr("height", 30)
                .attr("width", chart.width - chart.padding.yAxis)
                .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - 30})`);
        }
    },
    drag: {
        appendThresholdLine: function (chart: IChart, thresholds: number[]) {
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;
            thresholds.forEach((c, i) => {
                chart.renderElements.contentContainer.append("line")
                    .attr("class", `threshold-line ${i == 0 ? "distressed" : "soaring"}`)
                    .attr("x1", 0)
                    .attr("x2", chart.width - chart.padding.yAxis - chart.padding.right)
                    .attr("y1", yScale(c))
                    .attr("y2", yScale(c))
            });
        },
        appendThresholdPercentages: function (chart: IChart, bin: any, bandwithScale: any, tDistressed: number, tSoaring: number) {
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;
            let binData = function (data: IReflectionAuthorEntry[]) {
                let bins = bin(data.map(r => r.point));
                let result = [] as IBinData[]
                bins.forEach((c: number[]) => {
                    result.push({ bin: c, percentage: c.length / data.length * 100 });
                })
                return result;
            };

            let binContainer = chart.renderElements.contentContainer.selectAll(`.${chart.id}-violin-container`);

            binContainer.selectAll(`.${chart.id}-violin-text-container`).remove();

            let binTextContainer = binContainer.append("g")
                .attr("class", `${chart.id}-violin-text-container`);

            let binTextBox = binTextContainer.selectAll("rect")
                .data((d: IAnalyticsChartsData) => binData(d.value))
                .enter()
                .append("rect")
                .attr("class", "violin-text-box");

            let binText = binTextContainer.selectAll("text")
                .data((d: IAnalyticsChartsData) => binData(d.value))
                .enter()
                .append("text")
                .attr("class", "violin-text")
                .text((d: IBinData) => Math.round(d.percentage) + "%");

            binTextBox.attr("width", binText.node().getBBox().width + 10)
                .attr("height", binText.node().getBBox().height + 5);
            binTextBox.attr("y", (d: IBinData, i: number) => positionY(i))
                .attr("x", bandwithScale(0) - binTextBox.node().getBBox().width / 2);
            binText.attr("y", (d: IBinData, i: number) => positionY(i) + binText.node().getBBox().height)
                .attr("x", bandwithScale(0) - binText.node().getBBox().width / 2)
                .on("mouseover", onMouseover)
                .on("mouseout", onMouseout);

            function positionY(i: number) {
                return yScale(i == 0 ? tDistressed / 2 : i == 1 ? 50 : (100 - tSoaring) / 2 + tSoaring) - binTextBox.node().getBBox().height / 2
            }

            function onMouseover(e: any, d: IBinData) {
                chartFunctions.tooltip.appendTooltipText(chart, `Count: ${d.bin.length.toString()}`);
                chartFunctions.tooltip.positionTooltipContainer(chart, bandwithScale(0) + (3 * binTextBox.node().getBBox().width), parseInt(d3.select(this).attr("y")) - binTextBox.node().getBBox().height);
            }
            function onMouseout() {
                chart.renderElements.svg.select(".tooltip-container").transition()
                    .style("opacity", 0);
                chartFunctions.tooltip.removeTooltip(chart);
            }
        },
        getThresholdsValues: function (chart: IChart) {
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            let result: number[] = [30, 70];

            let dThreshold = chart.renderElements.contentContainer.select(".threshold-line.distressed");
            if (dThreshold != undefined) {
                result[0] = yScale.invert(dThreshold.attr("y1"));
            }
            let sThreshold = chart.renderElements.contentContainer.select(".threshold-line.soaring");
            if (sThreshold != undefined) {
                result[1] = yScale.invert(sThreshold.attr("y1"));
            }

            return result;
        }
    },
    transitions: {
        axis: function (chart: IChart, data: IAnalyticsChartsData[]) {
            let xScale = chart.x.scale as d3.ScaleBand<string>;
            xScale.domain(data.map(d => d.group));
            d3.select(`#${chart.id} .x-axis`).transition()
                .duration(750)
                .call(chart.x.axis);
        },
        bars: function (chart: IChart, data: IAnalyticsChartsDataStats[]) {
            let xScale = chart.x.scale as d3.ScaleBand<string>;
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            d3.selectAll(`#${chart.id} .content-container #${chart.id}-data`)
                .data(data)
                .transition()
                .duration(750)
                .attr("width", (d: IAnalyticsChartsDataStats) => xScale.bandwidth())
                .attr("height", (d: IAnalyticsChartsDataStats) => yScale(d.q1) - yScale(d.q3))
                .attr("y", (d: IAnalyticsChartsDataStats) => yScale(d.q3))
                .attr("x", (d: IAnalyticsChartsDataStats) => xScale(d.group));

            d3.selectAll(`#${chart.id} .content-container #${chart.id}-data`)
                .data(data)
                .transition()
                .duration(750)
                .attr("width", (d: IAnalyticsChartsDataStats) => xScale.bandwidth())
                .attr("height", (d: IAnalyticsChartsDataStats) => yScale(d.q1) - yScale(d.q3))
                .attr("y", (d: IAnalyticsChartsDataStats) => yScale(d.q3))
                .attr("x", (d: IAnalyticsChartsDataStats) => xScale(d.group));

            d3.selectAll(`#${chart.id} #${chart.id}-data-min-max`)
                .data(data)
                .transition()
                .duration(750)
                .attr("x1", (d: IAnalyticsChartsDataStats) => xScale(d.group) + (xScale.bandwidth() / 2))
                .attr("y1", (d: IAnalyticsChartsDataStats) => yScale(d.min))
                .attr("x2", (d: IAnalyticsChartsDataStats) => xScale(d.group) + (xScale.bandwidth() / 2))
                .attr("y2", (d: IAnalyticsChartsDataStats) => yScale(d.max));

            d3.selectAll(`#${chart.id} #${chart.id}-data-median`)
                .data(data)
                .transition()
                .duration(750)
                .attr("x1", (d: IAnalyticsChartsDataStats) => xScale(d.group))
                .attr("y1", (d: IAnalyticsChartsDataStats) => yScale(d.median))
                .attr("x2", (d: IAnalyticsChartsDataStats) => xScale(d.group) + xScale.bandwidth())
                .attr("y2", (d: IAnalyticsChartsDataStats) => yScale(d.median));
        },
        violin: function (chart: IChart, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
            let xScale = chart.x.scale as d3.ScaleBand<string>;
            let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

            //Create bandwidth scale
            let bandwithScale = d3.scaleLinear()
                .range([0, xScale.bandwidth()])
                .domain([-d3.max(data.map(r => r.value.length)), d3.max(data.map(r => r.value.length))]);

            //Create bins             
            let bin = d3.bin().domain([0, 100]).thresholds([0, tDistressed, tSoaring]);

            //Draw violins
            chart.renderElements.contentContainer.selectAll(`.${chart.id}-violin-container`).select("path")
                .datum((d: IAnalyticsChartsData) => bin(d.value.map(d => d.point)))
                .transition()
                .duration(750)
                .attr("d", d3.area()
                    .x0((d: number[]) => bandwithScale(-d.length))
                    .x1((d: number[]) => bandwithScale(d.length))
                    .y((d: number[], i: number) => yScale(i == 0 ? 0 : i == 1 ? 50 : 100))
                    .curve(d3.curveCatmullRom));

            //Append tooltip container
            chartFunctions.tooltip.appendTooltipContainer(chart);

            //Draw threshold percentages
            chartFunctions.drag.appendThresholdPercentages(chart, bin, bandwithScale, tDistressed, tSoaring);
        }
    }
};

var adminAnalyticsCharts = {
    renderGroupChart: function (chart: IChart, data: IAnalyticsChartsDataStats[]) {
        //Set scale types
        let xScale = chart.x.scale as d3.ScaleBand<string>;
        let yScale = chart.y.scale as d3.ScaleLinear<number, number, never>;

        //Select existing minMax lines
        let minMax = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data-min-max`)
            .data(data);

        //Remove old minMax lines
        minMax.exit().remove();

        //Append new minMax lines
        let minMaxEnter = minMax.enter()
            .append("line")
            .attr("id", `${chart.id}-data-min-max`)
            .attr("class", "box-line")
            .attr("x1", (d: IAnalyticsChartsDataStats) => xScale(d.group) + (xScale.bandwidth() / 2))
            .attr("x2", (d: IAnalyticsChartsDataStats) => xScale(d.group) + (xScale.bandwidth() / 2))
            .attr("y1", (d: IAnalyticsChartsDataStats) => yScale(d.min))
            .attr("y2", (d: IAnalyticsChartsDataStats) => yScale(d.max));

        //Merge existing and new minMax lines
        minMax.merge(minMaxEnter);

        //Select existing median lines
        let median = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data-median`)
            .data(data);

        //Remove old median lines
        median.exit().remove();

        //Append new median lines
        let medianEnter = median.enter()
            .append("line")
            .attr("id", `${chart.id}-data-median`)
            .attr("class", "box-line")
            .attr("x1", (d: IAnalyticsChartsDataStats) => xScale(d.group))
            .attr("x2", (d: IAnalyticsChartsDataStats) => xScale(d.group) + xScale.bandwidth())
            .attr("y1", (d: IAnalyticsChartsDataStats) => yScale(d.median))
            .attr("y2", (d: IAnalyticsChartsDataStats) => yScale(d.median));

        //Merge existing and new median lines
        median.merge(medianEnter);

        //Select existing boxes
        let boxes = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data`)
            .data(data);

        //Remove old boxes
        boxes.exit().remove();

        //Append new boxes
        let boxesEnter = boxes.enter()
            .append("rect")
            .attr("id", `${chart.id}-data`)
            .classed("bar", true)
            .attr("y", (d: IAnalyticsChartsDataStats) => yScale(d.q3))
            .attr("x", (d: IAnalyticsChartsDataStats) => xScale(d.group))
            .attr("width", (d: IAnalyticsChartsDataStats) => xScale.bandwidth())
            .attr("height", (d: IAnalyticsChartsDataStats) => yScale(d.q1) - yScale(d.q3));

        //Merge existing and new boxes
        boxes.merge(boxesEnter);

        //Transition boxes and lines
        chartFunctions.transitions.bars(chart, data);

        //Set render elements content to boxes
        chart.renderElements.content = chart.renderElements.contentContainer.selectAll(`#${chart.id}-data`);

        //Enable tooltip
        chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e: any, d: IAnalyticsChartsDataStats): void {
            //If box is clicked not append tooltip
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }

            //Append tooltip box with text
            let tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, d.group, [{ label: "q1", value: d.q1 }, { label: "q3", value: d.q3 }, { label: "Median", value: d.median }, { label: "Mean", value: d.mean }, { label: "Max", value: d.max }, { label: "Min", value: d.min }]);

            //Position tooltip container
            chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.q3, tooltipBox));
            function xTooltip(x: string, tooltipBox: any) {
                //Position tooltip right of the box
                let xTooltip = xScale(x) + xScale.bandwidth();

                //If tooltip does not fit position left of the box
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - xScale.bandwidth() - tooltipBox.node().getBBox().width;
                }

                return xTooltip
            }
            function yTooltip(y: number, tooltipBox: any) {
                //Position tooltip on top of the box
                let yTooltip = yScale(y) - (tooltipBox.node().getBBox().height / 2);

                //If tooltip does not fit position at the same height as the box
                if (yScale.invert(yTooltip) < 0) {
                    return yScale(y + yScale.invert(yTooltip));
                }
                return yTooltip;
            }
        }
        function onMouseout(): void {
            //Transition tooltip to opacity 0
            chart.renderElements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);

            //Remove tooltip
            chartFunctions.tooltip.removeTooltip(chart);
        }
        
        return chart;
    }
}