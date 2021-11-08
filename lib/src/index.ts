import * as d3 from "d3";

/* ------------------------------------------------
    Start data interfaces and classes 
-------------------------------------------------- */

interface IReflectionAuthorEntryRaw {
    timestamp: string;
    pseudonym: string;
    point: string;
    text: string;
}

interface IAnalyticsChartsDataRaw {
    group: string;
    value: IReflectionAuthorEntryRaw[];
    createDate: string;
    transformData(): AnalyticsChartsData;
}

class AnalyticsChartsDataRaw implements IAnalyticsChartsDataRaw {
    group: string;
    value: IReflectionAuthorEntryRaw[];
    createDate: string;
    constructor(group: string, value: IReflectionAuthorEntryRaw[], createDate: string) {
        this.group = group;
        this.value = value;
        this.createDate = createDate;
    }
    transformData(): AnalyticsChartsData {
        return new AnalyticsChartsData(this.group, this.value.map(d => {
            return {
                timestamp: new Date(d.timestamp), pseudonym: d.pseudonym, point: parseInt(d.point), text: d.text
            }
        }) as IReflectionAuthorEntry[], new Date(this.createDate), undefined, false);
    }
}

interface IReflectionAuthorEntry {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}

interface IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    getUsersData(): AnalyticsChartsData;
}

class AnalyticsChartsData implements IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    constructor(group: string, value: IReflectionAuthorEntry[], createDate: Date, colour: string = undefined, selected: boolean = false) {
        this.group = group;
        this.value = value;
        this.creteDate = createDate;
        this.colour = colour;
        this.selected = selected;
    }
    getUsersData(): AnalyticsChartsData {
        let usersMean = Array.from(d3.rollup(this.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
        return new AnalyticsChartsData(this.group, usersMean, this.creteDate, this.colour);
    }
}

interface IDataStats {
    stat: string;
    displayName: string;
    value: number | string;
}

class DataStats implements IDataStats {
    stat: string;
    displayName: string;
    value: number | string;
    constructor(stat: string, displayName: string, value: number | string){
        this.stat = stat,
        this.displayName = displayName,
        this.value = value
    }
}

interface IAnalyticsChartsDataStats extends IAnalyticsChartsData {
    stats: IDataStats[];
    roundDecimal(value: number): string;
    getStat(stat: string): IDataStats;
}

class AnalyticsChartsDataStats extends AnalyticsChartsData implements IAnalyticsChartsDataStats {
    stats: IDataStats[];
    constructor(entries: IAnalyticsChartsData) {
        super(entries.group, entries.value, entries.creteDate, entries.colour, entries.selected);
        let uniqueUsers = Array.from(d3.rollup(entries.value, d => d.length, d => d.pseudonym), ([key, value]) => ({ key, value }));
        this.stats = [];
        this.stats.push(new DataStats("mean", "Mean", Math.round(d3.mean(entries.value.map(r => r.point)))));
        this.stats.push(new DataStats("median", "Median", Math.round(d3.median(entries.value.map(r => r.point)))))
        this.stats.push(new DataStats("q1", "Q1", Math.round(d3.quantile(entries.value.map(r => r.point), 0.25))))
        this.stats.push(new DataStats("q3", "Q3", Math.round(d3.quantile(entries.value.map(r => r.point), 0.75))))
        this.stats.push(new DataStats("max", "Max", d3.max(entries.value.map(r => r.point))))
        this.stats.push(new DataStats("min", "Min", d3.min(entries.value.map(r => r.point))))
        this.stats.push(new DataStats("variance", "Variance", this.roundDecimal(d3.variance(entries.value.map(r => r.point)))))
        this.stats.push(new DataStats("deviation", "Std Deviation", this.roundDecimal(d3.deviation(entries.value.map(r => r.point)))))
        this.stats.push(new DataStats("oldRef", "Oldest reflection", d3.min(entries.value.map(r => new Date(r.timestamp))).toDateString()))
        this.stats.push(new DataStats("newRef", "Newest reflection", d3.max(entries.value.map(r => new Date(r.timestamp))).toDateString()))
        this.stats.push(new DataStats("totalRef", "Total reflections", d3.max(entries.value.map(r => new Date(r.timestamp))).toDateString()))
        this.stats.push(new DataStats("avgRef", "Reflections per user", this.roundDecimal(d3.mean(uniqueUsers.map(r => r.value)))))
        this.stats.push(new DataStats("userHRef", "Max reflections per user", d3.max(uniqueUsers.map(r => r.value))))
        this.stats.push(new DataStats("userLRef", "Min reflections per user", d3.min(uniqueUsers.map(r => r.value))))
        this.stats.push(new DataStats("totalUsers", "Total users", uniqueUsers.length))
    };
    roundDecimal(value: number): string {
        let p = d3.precisionFixed(0.1);
        let f = d3.format("." + p + "f");
        return f(value);
    };
    getStat(stat: string): IDataStats {
        var exists = this.stats.find(d => d.stat == stat);
        if (exists != undefined) {
            return exists;
        } else {
            return new DataStats("na", "Not found", 0);
        }
    }
}

/* ------------------------------------------------
    End data interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of charts interfaces and classes
-------------------------------------------------- */

// Basic interface for chart scales
interface IChartScales {
    x: ChartSeriesAxis | ChartTimeAxis;
    y: ChartLinearAxis;
}

// Basic interface for charts
interface IChart extends IChartScales {
    id: string;
    width: number;
    height: number;
    padding: IChartPadding;
    elements: IChartElements | IHistogramChartElements;
    click: boolean;
}

// Basic class for series charts
class ChartSeries implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartSeriesAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: string[]) {
        this.id = id;
        let containerDimensions = d3.select<HTMLDivElement, unknown>(`#${id} .chart-container`).node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding();
        this.y = new ChartLinearAxis("State", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        this.click = false;
        this.elements = new ChartElements(this);
    }
}

// Basic class for time series charts
class ChartTime implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    htmlContainers: IHtmlContainers;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: Date[]) {
        this.id = id;
        let containerDimensions = d3.select<HTMLDivElement, unknown>(`#${id} .chart-container`).node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(75, 75, 5);
        this.htmlContainers = new HtmlContainers();
        this.y = new ChartLinearAxis("State", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartTimeAxis("Time", domain, [0, this.width - this.padding.yAxis]);
        this.click = false;
        this.elements = new ChartElements(this);
    }
}

// Basic class for time series zoom bar
class ChartTimeZoom implements IChartScales {
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    constructor(chart: IChart, domain: Date[]) {
        this.x = new ChartTimeAxis("", domain, [0, chart.width - chart.padding.yAxis - 5]);
        this.y = new ChartLinearAxis("", [0, 100], [25, 0], "left");
    }
}

// Interface for histogram chart series
interface IHistogramChartSeries extends IChart {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    bin: d3.HistogramGeneratorNumber<number, number>;
    setBandwidth(data: IAnalyticsChartsData[]): void;
    setBin(): void;
}

// Class for histogram chart series
class HistogramChartSeries extends ChartSeries implements IHistogramChartSeries {
    elements: IHistogramChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    bandwidth: d3.ScaleLinear<number, number, never>;
    bin: d3.HistogramGeneratorNumber<number, number>;
    constructor(id: string, domain: string[]) {
        super(id, domain);
        this.padding = new ChartPadding(40, 75, 5, 85);
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        d3.select(`#${this.id} svg`).remove();
        this.thresholdAxis = this.y.setThresholdAxis(30, 70);
        this.elements = new HistogramChartElements(this);
    }
    setBandwidth(data: IAnalyticsChartsData[]): void {
        this.bandwidth = d3.scaleLinear()
            .range([0, this.x.scale.bandwidth()])
            .domain([-d3.max(data.map(r => r.value.length)), d3.max(data.map(r => r.value.length))]);
    };
    setBin(): void {
        this.bin = d3.bin().domain([0, 100]).thresholds([0, this.elements.getThresholdsValues(this)[0], this.elements.getThresholdsValues(this)[1]]);
    }
}

// Basic interface for chart axis scales
interface IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
}

// Basic class for series axis scale
class ChartSeriesAxis implements IChartAxis {
    scale: d3.ScaleBand<string>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    constructor(label: string, domain: string[], range: number[]) {
        this.label = label;
        this.scale = d3.scaleBand()
            .domain(domain)
            .rangeRound(range)
            .padding(0.25);
        this.axis = d3.axisBottom(this.scale);
    };
}

// Basic class for linear axis scale
class ChartLinearAxis implements IChartAxis {
    scale: d3.ScaleLinear<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    constructor(label: string, domain: number[], range: number[], position?: string) {
        this.label = label;
        this.scale = d3.scaleLinear()
            .domain([d3.min(domain), d3.max(domain)])
            .range(range);
        if (position == "right") {
            this.axis = d3.axisRight(this.scale);
        } else {
            this.axis = d3.axisLeft(this.scale);
        }
        let labels: Map<number | d3.AxisDomain, string> = new Map();
        labels.set(0, "distressed");
        labels.set(50, "going ok");
        labels.set(100, "soaring");
        this.axis.tickValues([0, 25, 50, 75, 100])
            .tickFormat(d => labels.get(d));
    };
    setThresholdAxis(tDistressed: number, tSoaring: number) : d3.Axis<d3.NumberValue> {
        return d3.axisRight(this.scale)
            .tickValues([tDistressed, tSoaring])
            .tickFormat(d => d == tDistressed ? "Distressed" : d == tSoaring ? "Soaring" : "");
    }
}

// Basic class for time axis scale
class ChartTimeAxis implements IChartAxis {
    scale: d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    constructor(label: string, domain: Date[], range: number[]) {
        this.label = label;
        this.scale = d3.scaleTime()
            .domain(domain)
            .range(range);
        this.axis = d3.axisBottom(this.scale)
    };
}

// Basic interface for chart elements (includes zoom)
interface IChartElements {
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, unknown, SVGGElement, any>;
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}

// Basic class for chart elements (includes zoom)
class ChartElements implements IChartElements {
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    content: d3.Selection<SVGRectElement | SVGCircleElement | SVGPathElement, unknown, SVGGElement, any>;
    xAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    yAxis: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomSVG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    zoomFocus: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    constructor(chart: IChart) {
        this.svg = this.appendSVG(chart);
        this.contentContainer = this.appendContentContainer(chart);
        this.xAxis = this.appendXAxis(chart);
        this.appendXAxisLabel(chart);
        this.yAxis = this.appendYAxis(chart);
        this.appendYAxisLabel(chart);
    }
    private appendSVG(chart: IChart): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
        let svg = d3.select(`#${chart.id} .chart-container`)
            .append("svg")
            .attr("id", `chart-${chart.id}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${chart.width} ${chart.height}`);
        let filter = svg.append("defs")
            .append("filter")
            .attr("id", "f-help")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "200%")
            .attr("height", "200%");
        filter.append("feOffset")
            .attr("result", "offOut")
            .attr("in", "SourceGraphic")
            .attr("dx", 10)
            .attr("dy", 10);
        filter.append("feGaussianBlur")
            .attr("result", "blurOut")
            .attr("in", "offOut")
            .attr("stdDeviation", 10)
        filter.append("feBlend")
            .attr("in", "SourceGraphic")
            .attr("in2", "blurOut")
            .attr("mode", "normal");
        return svg;
    };
    private appendContentContainer(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        let result = this.svg.append("g")
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
    private appendXAxis(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - chart.padding.xAxis})`)
            .attr("class", "x-axis")
            .attr("clip-path", `url(#clip-${chart.id})`)
            .call(chart.x.axis);
    };
    private appendXAxisLabel(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (this.svg.select<SVGGElement>(".x-axis").node().getBBox().width / 2 + chart.padding.yAxis) + ", " + (chart.height - chart.padding.xAxis + this.svg.select<SVGGElement>(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(chart.x.label);
    };
    private appendYAxis(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.padding.top})`)
            .attr("class", "y-axis")
            .call(chart.y.axis);
    };
    private appendYAxisLabel(chart: IChart): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (chart.padding.yAxis - this.svg.select<SVGGElement>(".y-axis").node().getBBox().width) + ", " + (chart.padding.top + this.svg.select<SVGGElement>(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(chart.y.label);
    }
}

// Interface for histogram charts
interface IHistogramChartElements extends IChartElements {
    getThresholdsValues(chart: HistogramChartSeries): number[];
}

// Class for histogram charts
class HistogramChartElements extends ChartElements implements IHistogramChartElements {
    constructor(chart: IHistogramChartSeries) {
        super(chart);
        let thresholds = this.getThresholdsValues(chart);
        this.appendThresholdAxis(chart);
        this.appendThresholdIndicators(chart, thresholds);
        this.appendThresholdLabel(chart);
    }
    private appendThresholdAxis(chart: IHistogramChartSeries): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return this.contentContainer.append("g")
            .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right}, 0)`)
            .attr("class", "threshold-axis")
            .call(chart.thresholdAxis);
    };
    private appendThresholdLabel(chart: IHistogramChartSeries): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        let label = this.svg.append("g")
            .attr("class", "threshold-label-container")
        label.append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text("Thresholds");
        label.attr("transform", `translate(${chart.width - chart.padding.right + this.contentContainer.select<SVGGElement>(".threshold-axis").node().getBBox().width + label.node().getBBox().height}, ${chart.padding.top + this.svg.select<SVGGElement>(".y-axis").node().getBBox().height / 2}) rotate(-90)`);
        return label;
    };
    private appendThresholdIndicators(chart: IHistogramChartSeries, thresholds: number[]): void {
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
                .attr("width", g.select<SVGTextElement>("text").node().getBBox().width + 10)
                .attr("height", g.select<SVGTextElement>("text").node().getBBox().height + 5)
                .attr("y", -g.select<SVGTextElement>("text").node().getBBox().height));
        
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
    getThresholdsValues(chart: IHistogramChartSeries): number[] {
        let result: number[] = [30, 70];
        let dThreshold = this.contentContainer.select<SVGLineElement>(".threshold-line.distressed");
        if (!dThreshold.empty()) {
            result[0] = chart.y.scale.invert(parseInt(dThreshold.attr("y1")));
        }
        let sThreshold = this.contentContainer.select<SVGLineElement>(".threshold-line.soaring");
        if (!sThreshold.empty()) {
            result[1] = chart.y.scale.invert(parseInt(sThreshold.attr("y1")));
        }
        return result;
    };
}

// Basic interface for chart padding
interface IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
}

// Basic class for chart paddinf
class ChartPadding implements IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
    constructor(xAxis?: number, yAxis?: number, top?: number, right?: number) {
        this.xAxis = xAxis == undefined ? 40 : xAxis;
        this.yAxis = yAxis == undefined ? 75 : yAxis;
        this.top = top == undefined ? 5 : top;
        this.right = right == undefined ? 0 : right;
    }
}

// Interface for bin hover data
interface IHistogramData {
    group: string;
    colour: string;
    bin: d3.Bin<number, number>;
    percentage: number;
}

// Class for bin hover data
class HistogramData implements IHistogramData {
    group: string;
    colour : string;
    bin: d3.Bin<number, number>;
    percentage: number;
    constructor(group: string, colour: string, bin: d3.Bin<number, number>, percentage: number) {
        this.group = group;
        this.colour = colour;
        this.bin = bin;
        this.percentage = percentage;
    }
}

// Interface click text data
interface IClickTextData {
    clickData: {stat: IDataStats | number, group: string};
    data: {stat: IDataStats | number, group: string};
}

// Class click text data
class ClickTextData implements IClickTextData {
    clickData: {stat: IDataStats | number, group: string};
    data: {stat: IDataStats | number, group: string};
    constructor(clickStat: IDataStats | number, dataStat: IDataStats | number, clickGroup: string, dataGroup: string) {
        this.clickData = {stat: clickStat, group: clickGroup},
        this.data = {stat: dataStat, group: dataGroup}
    }
}

// Basic interface for Html containers
interface IHtmlContainers {
    boxPlot: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    statistics: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    timeline: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    histogram: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    userHistogram: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    compare: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
    userStatistics: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    remove(): void;
    removeUsers(): void;
    appendDiv(id: string, css: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    appendCard(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, header: string, id?: string, help?: boolean): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    helpPopover(button: any, id: string, content?: string): boolean;
    removeHelp(chart: IChart): void;
    renderNavbarScrollspy(): void;
    renderNavbarScrollspyItem(id: string, name: string): void;
    removeNavbarScrollspyItem(id: string): void;
}

// Basic class for Html containers
class HtmlContainers implements IHtmlContainers {
    boxPlot: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    statistics: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    timeline: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    histogram: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    userHistogram: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    compare: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    userStatistics: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    remove() {
        if (this.statistics != undefined) {
            this.statistics.remove();
            this.statistics = undefined;
        }
        if (this.timeline != undefined) {
            this.removeNavbarScrollspyItem(this.timeline.attr("id"));
            this.timeline.remove();
            this.timeline = undefined;
        }
        if (this.histogram != undefined) {
            this.removeNavbarScrollspyItem(this.histogram.attr("id"));
            this.histogram.remove();
            this.histogram = undefined;
        }
        if (this.userHistogram != undefined) {
            this.userHistogram.remove();
            this.userHistogram = undefined;
        }
        if (this.compare != undefined) {
            this.compare.remove();
        }
        this.removeUsers();
    };
    removeUsers() {
        if (this.userStatistics != undefined) {
            this.removeNavbarScrollspyItem(this.userStatistics.attr("id"));
            this.userStatistics.remove();
            this.userStatistics = undefined;
        }
    };
    appendDiv(id: string, css: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        return d3.select("#analytics-charts").append("div")
            .attr("id", id)
            .attr("class", css);
    };
    appendCard(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, header: string, id?: string, help: boolean = false): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        return div.append("div")
            .attr("class", "card")
            .attr("id", id != null ? id : "no-id")
            .call(div => div.append("div")
                .attr("class", "card-header")
                .html(!help ? header : header + `<button type="button" class="btn btn-light btn-sm float-right"><i class="fas fa-question-circle"></i></button>`))
            .call(div => div.append("div").attr("class", "card-body chart-container"))
    };
    helpPopover(button: any, id: string, content?: string): boolean {
        if (d3.select(`#${id}`).empty()) {
            let popover = d3.select("body").append("div")
                .attr("id", id)
                .attr("class", "popover fade bs-popover-left show")
                .style("top", `${window.pageYOffset + button.node().getBoundingClientRect().top}px`);
            popover.append("div")
                .attr("class", "arrow")
                .style("top", "6px");
            popover.append("div")
                .attr("class", "popover-body")
                .html(content == undefined ? "Interactive elements are faded" : content);
            popover.style("left", `${button.node().getBoundingClientRect().left - popover.node().getBoundingClientRect().width}px`);
            return true;
        } else {
            d3.select(`#${id}`).remove();
            return false;
        }
    };
    removeHelp(chart: IChart): void {
        d3.select(`#${chart.id}-help`).remove();
        d3.select(`#${chart.id}-help-button`).remove();
        d3.select(`#${chart.id}-help-data`).remove();
        d3.select(`#${chart.id}-help-drag`).remove();
        d3.select(`#${chart.id}-help-zoom`).remove();
        if(!d3.select(`#${chart.id} #sort-by`).empty()) {
            d3.select(`#${chart.id} #sort-by`).style("box-shadow", null);
        }
        if(!d3.select(`#${chart.id} #timeline-plot`).empty()) {
            d3.select(`#${chart.id} #timeline-plot`).style("box-shadow", null);
        }
        chart.elements.contentContainer.selectAll("rect").attr("filter", null);
        chart.elements.contentContainer.selectAll("circle").attr("filter", null);
    };
    renderNavbarScrollspy(): void {
        d3.select("body")
            .attr("data-spy", "scroll")
            .attr("data-target", "#analytics-navbar")
            .attr("data-offset", 0);

        this.renderNavbarScrollspyItem(this.boxPlot.attr("id"), "Box Plot");
        if(this.histogram != undefined) {
            this.renderNavbarScrollspyItem(this.histogram.attr("id"), "Histograms");
        }
        if(this.timeline != undefined) {
            this.renderNavbarScrollspyItem(this.timeline.attr("id"), "Timeline");
        }        
        if(this.userStatistics != undefined) {
            this.renderNavbarScrollspyItem(this.userStatistics.attr("id"), "Users");
        }
    };
    renderNavbarScrollspyItem(id: string, name: string): void {
        let exists = d3.select("#analytics-navbar ul").selectAll("a").filter(function() {
            return d3.select(this).attr("href") == `#${id}`;
        });
        if(exists.empty()) {
            d3.select("#analytics-navbar ul").append("li")
                .attr("class", "nav-item")
                .attr("id", `${id}-li`)
                .append("a")
                .attr("class", "nav-link")
                .attr("href", `#${id}`)
                .html(name);   
        }
    };
    removeNavbarScrollspyItem(id: string): void {
        d3.select(`#analytics-navbar ul #${id}-li`).remove();
    }
}

/* ------------------------------------------------
    End of charts interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of admin control interfaces and classes 
-------------------------------------------------- */

interface IAdminControlCharts {
    htmlContainers: IHtmlContainers;
    interactions: IAdminControlInteractions;
    sidebarBtn(): void;
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[];
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries;
    renderGroupStats(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsDataStats): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    renderHistogram(chart: HistogramChartSeries, data: IAnalyticsChartsData[]): HistogramChartSeries;
    handleHistogramHover(chart: HistogramChartSeries, bandwidth: d3.ScaleLinear<number, number, never>): void;
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData): ChartTime;
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): ChartTime;
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): void;
    renderUserStatistics(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsData, pseudonym?: string): void;
}

class AdminControlCharts implements IAdminControlCharts {
    htmlContainers = new HtmlContainers();
    interactions = new AdminControlInteractions();
    sidebarBtn(): void {
        //Handle side bar btn click
        d3.select("#sidebar-btn").on("click", () => {
            let isActive = d3.select("#sidebar").attr("class").includes("active");
            d3.select("#sidebar")
                .attr("class", isActive ? "" : "active");
        });
    };
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[] {
        d3.select("#groups")
            .selectAll("li")
            .data(allEntries)
            .enter()
            .append("li")
            .html(d => `<div class="input-group mb-1">
                                <div class="input-group-prepend">
                                    <div class="input-group-text group-row">
                                        <input type="checkbox" value="${d.group}" checked disabled />
                                    </div>                               
                                </div>
                                <input type="text" value="${d.group}" class="form-control group-row" disabled />
                                <div class="input-group-append">
                                    <div class="input-group-text group-row">
                                        <input type="color" value="${d.colour}" id="colour-${d.group}" disabled />
                                    </div>                                
                                </div>
                            </div>  `);
        return allEntries;
    };
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries {
        //MinMax lines processing
        chart.elements.contentContainer.selectAll<SVGLineElement, IAnalyticsChartsDataStats>(`#${chart.id}-data-min-max`)
            .data(data)
            .join(
                enter => enter.append("line")
                            .attr("id", `${chart.id}-data-min-max`)
                            .attr("class", "box-line")
                            .attr("x1", d => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
                            .attr("x2", d => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
                            .attr("y1", d => chart.y.scale(d.getStat("min").value as number))
                            .attr("y2", d => chart.y.scale(d.getStat("max").value as number))
                            .style("stroke", d => d.colour)
                            .call(enter => enter.transition().duration(750)
                                    .attr("y2", d => chart.y.scale(d.getStat("max").value as number))),
                update => update.style("stroke", d => d.colour)
                            .call(update => update.transition()
                                .duration(750)
                                .attr("x1", d => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
                                .attr("x2", d => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
                                .attr("y1", d => chart.y.scale(d.getStat("min").value as number))
                                .attr("y2", d => chart.y.scale(d.getStat("max").value as number))),
                exit => exit.style("stroke", "#b3b3b3")
                            .call(exit => exit.transition()
                                .duration(250)
                                .attr("y2", d => chart.y.scale(d.getStat("min").value as number))
                                .remove())
            );

        //Median lines processing
        chart.elements.contentContainer.selectAll<SVGLineElement, IAnalyticsChartsDataStats>(`#${chart.id}-data-median`)
            .data(data)
            .join(
                enter => enter.append("line")
                            .attr("id", `${chart.id}-data-median`)
                            .attr("class", "box-line")
                            .attr("x1", d => chart.x.scale(d.group))
                            .attr("x2", d => chart.x.scale(d.group))
                            .attr("y1", d => chart.y.scale(d.getStat("median").value as number))
                            .attr("y2", d => chart.y.scale(d.getStat("median").value as number))
                            .style("stroke", d => d.colour)
                            .call(enter => enter.transition()
                                .duration(750)
                                .attr("x2", d => chart.x.scale(d.group) + chart.x.scale.bandwidth())),
                update => update.style("stroke", d => d.colour)
                            .call(update => update.transition()
                                .duration(750)
                                .attr("x1", d => chart.x.scale(d.group))
                                .attr("x2", d => chart.x.scale(d.group) + chart.x.scale.bandwidth())
                                .attr("y1", d => chart.y.scale(d.getStat("median").value as number))
                                .attr("y2", d => chart.y.scale(d.getStat("median").value as number))),
                exit => exit.style("stroke", "#b3b3b3")
                            .call(exit => exit.transition()
                                .duration(250)
                                .attr("x2", function(){ return parseInt(this.getAttribute("x1")) })
                                .remove())
            );

        //Boxes processing
        chart.elements.content = chart.elements.contentContainer.selectAll<SVGRectElement, IAnalyticsChartsDataStats>(`#${chart.id}-data`)
            .data(data)
            .join(
                enter => enter.append("rect")
                            .attr("id", `${chart.id}-data`)
                            .attr("class", "bar")
                            .attr("y", d => chart.y.scale(d.getStat("q1").value as number))
                            .attr("x", d => chart.x.scale(d.group))
                            .attr("width", chart.x.scale.bandwidth())
                            .attr("height", 0)
                            .style("stroke", d => d.colour)
                            .style("fill", d => d.colour)
                            .call(update => update.transition()
                                .duration(750)
                                .attr("height", d => chart.y.scale(d.getStat("q1").value as number) - chart.y.scale(d.getStat("q3").value as number))
                                .attr("y", d => chart.y.scale(d.getStat("q3").value as number))),
                update => update.style("stroke", d => d.colour)
                            .style("fill", d => d.colour)
                            .call(update => update.transition()
                                .duration(750)
                                .attr("y", d => chart.y.scale(d.getStat("q3").value as number))
                                .attr("x", d => chart.x.scale(d.group))
                                .attr("width", chart.x.scale.bandwidth())
                                .attr("height", d => chart.y.scale(d.getStat("q1").value as number) - chart.y.scale(d.getStat("q3").value as number))),
                exit => exit.style("fill", "#cccccc")
                            .style("stroke", "#b3b3b3")
                            .call(exit => exit.transition()
                                .duration(250)
                                .attr("y", d => chart.y.scale(d.getStat("q1").value as number))
                                .attr("height", 0)
                                .remove())
            );      

        let _this = this;

        //Enable tooltip
        this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e: Event, d: IAnalyticsChartsDataStats): void {
            //If box is clicked not append tooltip
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.interactions.tooltip.appendTooltipContainer(chart);

            //Append tooltip box with text
            let tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.group, d.stats.filter((c, i) => i < 6).map(c => new TooltipValues(c.stat, c.value as number)));

            //Position tooltip container
            _this.interactions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.getStat("q3").value as number, tooltipBox));
            function xTooltip(x: string, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                //Position tooltip right of the box
                let xTooltip = chart.x.scale(x) + chart.x.scale.bandwidth();

                //If tooltip does not fit position left of the box
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - chart.x.scale.bandwidth() - tooltipBox.node().getBBox().width;
                }

                return xTooltip
            }
            function yTooltip(y: number, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                //Position tooltip on top of the box
                let yTooltip = chart.y.scale(y) - (tooltipBox.node().getBBox().height / 2);

                //If tooltip does not fit position at the same height as the box
                if (chart.y.scale.invert(yTooltip) < 0) {
                    return chart.y.scale(y + chart.y.scale.invert(yTooltip));
                }
                return yTooltip;
            }
        }
        function onMouseout(): void {
            //Transition tooltip to opacity 0
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);

            //Remove tooltip
            _this.interactions.tooltip.removeTooltip(chart);
        }

        return chart;
    }
    renderGroupStats(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsDataStats): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        div.select(".card-body").html("");
        return div.select<HTMLDivElement>(".card-body")
            .attr("class", "card-body statistics-text")
            .selectAll("p")
            .data(data.stats)
            .enter()
            .append("p")
            .attr("class", "my-0")
            .html(d => `<b>${d.displayName}: </b>${d.value}`);
    };
    renderHistogram(chart: HistogramChartSeries, data: IAnalyticsChartsData[]): HistogramChartSeries {
        chart.setBandwidth(data);
        chart.setBin();

        //Process histogram
        chart.elements.contentContainer.selectAll<SVGGElement, IAnalyticsChartsData>(`.${chart.id}-histogram-container`)
            .data(data)
            .join(
                enter => enter.append("g")
                    .attr("class", `${chart.id}-histogram-container`)
                    .attr("transform", d => `translate(${chart.x.scale(d.group)}, 0)`)
                    .call(enter => enter.selectAll(".histogram-rect")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .enter()
                        .append("rect")
                        .attr("id", `${chart.id}-data`)
                        .attr("class", "histogram-rect")
                        .attr("x", c => chart.bandwidth(-c.bin.length))
                        .attr("y", c => chart.y.scale(c.bin.x0))
                        .attr("height", 0)
                        .attr("width", c => chart.bandwidth(c.bin.length) - chart.bandwidth(-c.bin.length))
                        .style("stroke", c => c.colour)
                        .style("fill", c => c.colour)
                        .transition()
                        .duration(750)
                        .attr("y", c => chart.y.scale(c.bin.x1))
                        .attr("height", c => chart.y.scale(c.bin.x0) - chart.y.scale(c.bin.x1))),
                update => update
                    .call(update => this.interactions.histogram(chart, update))
                    .call(update => update.transition()
                        .duration(750)
                        .attr("transform", d => `translate(${chart.x.scale(d.group)}, 0)`)),
                exit => exit
                    .call(exit => exit.selectAll<SVGRectElement, IHistogramData>(".histogram-rect")
                        .style("fill", "#cccccc")
                        .style("stroke", "#b3b3b3")
                        .transition()
                        .duration(250)
                        .attr("y", c => chart.y.scale(c.bin.x0))
                        .attr("height", 0)) 
                    .call(exit => exit.transition()
                        .duration(250)   
                        .remove())
            );
        
        chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-data`);

        //Append tooltip container
        this.handleHistogramHover(chart);
        return chart;
    };
    handleHistogramHover(chart: HistogramChartSeries): void {
        let _this = this;
        _this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);

        function onMouseover(e: Event, d: HistogramData) {
            _this.interactions.tooltip.appendTooltipContainer(chart);
            let tooltipBox =_this.interactions.tooltip.appendTooltipText(chart, d.bin.x0 == 0 ? "Distressed" : d.bin.x1 == 100 ? "Soaring" : "GoingOK" , [new TooltipValues("Total", `${d.bin.length} (${d.percentage}%)`)]);
            _this.interactions.tooltip.positionTooltipContainer(chart, chart.x.scale(d.group) + chart.bandwidth(d.bin.length), d.bin.x1 > 25 ? chart.y.scale(d.bin.x1) : chart.y.scale(d.bin.x0) - tooltipBox.node().getBBox().height);
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.interactions.tooltip.removeTooltip(chart);
        }
    }
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData): ChartTime {
        let _this = this;

        //Remove scatter plot
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`).remove();
        chart.elements.svg.selectAll(".zoom-container").remove();
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
        chart.elements.zoomSVG = undefined;
        chart.elements.zoomFocus = undefined;

        //Draw contours
        drawContours();

        //Draw contours function
        function drawContours() {
            let densityData = d3.contourDensity<IReflectionAuthorEntry>()
            .x(d => chart.x.scale(d.timestamp))
            .y(d => chart.y.scale(d.point))
            .bandwidth(5)
            .thresholds(20)
            .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])
            (data.value);

            chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`)
            .data(densityData)
            .join(
                enter => enter.append("path")
                    .attr("id", `${chart.id}-timeline-contours`)
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())               
                    .attr("stroke", d => d3.interpolateRgb("#ffffff", data.colour)(d.value * 25))
                    .attr("fill", d => d3.interpolateRgb("#ffffff", data.colour)(d.value * 20)),
                update => update .attr("d", d3.geoPath())               
                    .attr("stroke", d => d3.interpolateRgb("#ffffff", data.colour)(d.value * 25))
                    .attr("fill", d => d3.interpolateRgb("#ffffff", data.colour)(d.value * 20)),
                exit => exit.remove()
            );
        }
       

        //Enable zoom
        this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
            chart.x.scale.rangeRound(newChartRange);

            drawContours();

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
            _this.htmlContainers.removeHelp(chart);
        }
        return chart;
    };
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): ChartTime {
        //Remove density plot
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`).remove();

        //Draw circles
        chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`)
        .data(data.value)
        .join(
            enter => enter.append("circle")
                .attr("class", "line-circle")
                .attr("id", `${chart.id}-timeline-circles`)
                .attr("r", 5)
                .attr("cx", d => chart.x.scale(d.timestamp))
                .attr("cy", d => chart.y.scale(d.point))
                .style("stroke", data.colour)
                .style("fill", data.colour),
            update => update.style("stroke", data.colour)
                .style("fill", data.colour)
                .call(update => update.transition()
                .duration(750)
                .attr("cx", d => chart.x.scale(d.timestamp))
                .attr("cy", d => chart.y.scale(d.point))),
            exit => exit.remove()
        )
       
        let _this = this;

        //Enable tooltip       
        _this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e: Event, d: IReflectionAuthorEntry) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.interactions.tooltip.appendTooltipContainer(chart);
            let tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.timestamp.toDateString(), 
                [new TooltipValues("User", d.pseudonym), 
                 new TooltipValues("State", d.point)]);
            _this.interactions.tooltip.positionTooltipContainer(chart, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));

            function xTooltip(x: Date, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                let xTooltip = chart.x.scale(x);
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - tooltipBox.node().getBBox().width;
                }
                return xTooltip
            };

            function yTooltip(y: number, tooltipBox: d3.Selection<SVGRectElement, unknown, HTMLElement, any>) {
                var yTooltip = chart.y.scale(y) - tooltipBox.node().getBBox().height - 10;
                if (yTooltip < 0) {
                    return yTooltip + tooltipBox.node().getBBox().height + 20;
                }
                return yTooltip;
            };

            _this.interactions.tooltip.appendLine(chart, 0, chart.y.scale(d.point), chart.x.scale(d.timestamp), chart.y.scale(d.point), data.colour);
            _this.interactions.tooltip.appendLine(chart, chart.x.scale(d.timestamp), chart.y.scale(0), chart.x.scale(d.timestamp), chart.y.scale(d.point), data.colour);
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.interactions.tooltip.removeTooltip(chart);
        }

        //Append zoom bar
        if (chart.elements.zoomSVG == undefined) {
            chart.elements.zoomSVG = _this.interactions.zoom.appendZoomBar(chart);
            chart.elements.zoomFocus = chart.elements.zoomSVG.append("g")
                .attr("class", "zoom-focus");
        }

        //Process zoom circles
        chart.elements.zoomSVG.selectAll(`#${chart.id}-zoom-bar-content`)
            .data(data.value)
            .join(
                enter => enter.append("circle")
                    .attr("class", "zoom-circle")
                    .attr("id", `${chart.id}-zoom-bar-content`)
                    .attr("r", 2)
                    .attr("cx", d => zoomChart.x.scale(d.timestamp))
                    .attr("cy", d => zoomChart.y.scale(d.point))
                    .style("stroke", data.colour)
                    .style("fill", data.colour),
                update => update.style("stroke", data.colour)
                    .style("fill", data.colour)
                    .call(update => update.transition()
                    .duration(750)
                    .attr("cx", d => zoomChart.x.scale(d.timestamp))
                    .attr("cy", d => zoomChart.y.scale(d.point))),
                exit => exit.remove()
            );

        chart.elements.zoomFocus.selectAll(`#${chart.id}-zoom-content`)
        .data(data.value)
        .join(
            enter => enter.append("circle")
                .attr("class", "zoom-content")
                .attr("id", `${chart.id}-zoom-content`)
                .attr("r", 2)
                .attr("cx", d => zoomChart.x.scale(d.timestamp))
                .attr("cy", d => zoomChart.y.scale(d.point)),
            update => update.attr("cx", d => zoomChart.x.scale(d.timestamp))
                .attr("cy", d => zoomChart.y.scale(d.point)),
            exit => exit.remove()
        );  
           
        //Enable zoom
        _this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
            chart.x.scale.rangeRound(newChartRange);
            zoomChart.x.scale.rangeRound([0, chart.width - chart.padding.yAxis - 5].map(d => e.transform.invertX(d)));
            let newLine = d3.line<IReflectionAuthorEntry>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point));

            chart.elements.contentContainer.selectAll<SVGCircleElement, IReflectionAuthorEntry>(`#${chart.id}-timeline-circles`)
                .attr("cx", d => chart.x.scale(d.timestamp));

            chart.elements.zoomFocus.selectAll<SVGCircleElement, IReflectionAuthorEntry>(".zoom-content")
                .attr("cx", d => zoomChart.x.scale(d.timestamp));

            chart.elements.contentContainer.selectAll<SVGLineElement, IReflectionAuthorEntry[]>(`#${chart.id}-timeline-circles-line`)
                .attr("d", d => newLine(d));

            chart.elements.contentContainer.selectAll<SVGRectElement, IReflectionAuthorEntry>(".click-container")
                .attr("transform", d => `translate(${chart.x.scale(d.timestamp)}, ${chart.y.scale(d.point)})`)

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
            _this.htmlContainers.removeHelp(chart);
        }
        return chart;
    };
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): void {
        let _this = this
        d3.select(`#${chart.id} #timeline-plot`).on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            if (selectedOption == "density") {
                if (!chart.elements.contentContainer.select(`#${chart.id}-timeline-circles-line`).empty()) {
                    _this.htmlContainers.removeUsers();
                }
                _this.renderTimelineDensity(chart, data);
            }
            if (selectedOption == "scatter") {
                _this.renderTimelineScatter(chart, zoomChart, data);
            }
            if (!d3.select(`#${chart.id}-help`).empty()) {
                _this.htmlContainers.removeHelp(chart);
            }
        });
    };
    renderUserStatistics(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsData, pseudonym?: string): void {
        let userData = data.getUsersData();
        let groupMean = Math.round(d3.mean(data.value.map(d => d.point)));
        let cardRow = card.select(".card-body")
            .append("div")
            .attr("class", "row");
        cardRow.append("div")
            .attr("class", "col-md-3")
            .append("div")
            .attr("class", "list-group scroll-list")
            .selectAll("a")
            .data(userData.value)
            .enter()
            .append("a")
            .attr("class", (d, i) => `list-group-item list-group-item-action ${pseudonym == undefined ? i == 0 ? "active" : "" : d.pseudonym == pseudonym ? "active" : ""}`)
            .attr("data-toggle", "list")
            .attr("href", d => `#${userData.group}-${d.pseudonym}`)
            .html(d => d.pseudonym);

        let tabPane = cardRow.append("div")
            .attr("class", "col-md-9")
            .append("div")
            .attr("class", "tab-content")
            .selectAll("div")
            .data(userData.value)
            .enter()
            .append("div")
            .attr("class", (d, i) => `tab-pane fade ${pseudonym == undefined ? i == 0 ? "show active" : "" : d.pseudonym == pseudonym ? "show active" : ""}`)
            .attr("id", d => `${userData.group}-${d.pseudonym}`)
            .html(d => `<div class="row">
                            <div class="col-md-4 statistics-text">
                                <b>Mean: </b>${d.point} (<span class="${(d.point - groupMean) < 0 ? "negative" : "positive"}">${(d.point - groupMean) < 0 ? "" : "+"}${d.point - groupMean}</span> compared to the group mean)<br>
                                <b>Min: </b>${d3.min(d3.filter(data.value, x => x.pseudonym == d.pseudonym).map(r => r.point))}<br>
                                <b>Min date: </b>${((d3.sort(d3.filter(data.value, x => x.pseudonym == d.pseudonym), (r: IReflectionAuthorEntry) => r.point)[0]).timestamp).toDateString()}<br>
                                <b>Max: </b>${d3.max(d3.filter(data.value, x => x.pseudonym == d.pseudonym).map(r => r.point))}<br>
                                <b>Max date: </b>${((d3.sort(d3.filter(data.value, x => x.pseudonym == d.pseudonym), (r: IReflectionAuthorEntry) => r.point)[d3.filter(data.value, x => x.pseudonym == d.pseudonym).length - 1]).timestamp).toDateString()}<br>
                                <b>Total: </b>${d3.filter(data.value, x => x.pseudonym == d.pseudonym).length}<br>
                                <b>Std Deviation: </b>${new AnalyticsChartsDataStats(data).roundDecimal(d3.deviation(d3.filter(data.value, x => x.pseudonym == d.pseudonym).map(r => r.point)))}<br>
                                <b>Variance: </b>${new AnalyticsChartsDataStats(data).roundDecimal(d3.variance(d3.filter(data.value, x => x.pseudonym == d.pseudonym).map(r => r.point)))}<br>
                                <b>Oldest reflection: </b>${(d3.min(d3.filter(data.value, x => x.pseudonym == d.pseudonym).map(r => r.timestamp))).toDateString()}<br>
                                <b>Newest reflection: </b>${(d3.max(d3.filter(data.value, x => x.pseudonym == d.pseudonym).map(r => r.timestamp))).toDateString()}<br>
                            </div>
                        </div>`);
        tabPane.select(".row").append("div")
            .attr("class", "col-md-8")
            .selectAll("p")
            .data(d => d3.sort(d3.filter(data.value, x => x.pseudonym == d.pseudonym), r => r.timestamp))
            .enter()
            .append("p")
            .html(d => `<b>${d.timestamp.toDateString()} - State: ${d.point}</b><br>${d.text}`);
        cardRow.select(".scroll-list")
            .style("height", `${cardRow.select<HTMLElement>(".tab-pane.fade.show.active").node().getBoundingClientRect().height}px`);
        cardRow.selectAll("a")
            .on("click", function () {
                setTimeout(() => {
                    cardRow.select(".scroll-list")
                    .transition()
                    .duration(750)
                    .style("height", `${cardRow.select<HTMLElement>(".tab-pane.fade.show.active").node().getBoundingClientRect().height}px`)
                }, 250);
            });
    };
}

interface IAdminControlTransitions {
    axisSeries(chart: ChartSeries, data: IAnalyticsChartsData[]): void;
    axisTime(chart: ChartTime, data: IAnalyticsChartsData): void;
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>): void;
}

class AdminControlTransitions implements IAdminControlTransitions {
    axisSeries(chart: ChartSeries, data: IAnalyticsChartsData[]): void {
        chart.x.scale.domain(data.map(d => d.group));
        d3.select<SVGGElement, unknown>(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    axisTime(chart: ChartTime, data: IAnalyticsChartsData): void {
        chart.x.scale.domain(d3.extent(data.value.map(d => d.timestamp)));
        d3.select<SVGGElement, unknown>(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>): void {        
        update.selectAll(".histogram-rect")
            .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
            .join(
                enter => enter,
                update => update.style("stroke", d => d.colour)
                    .style("fill", d => d.colour)
                    .call(update => update.transition()
                        .duration(750)
                        .attr("x", d => chart.bandwidth(-d.bin.length))
                        .attr("y", d => chart.y.scale(d.bin.x1))
                        .attr("height", d => chart.y.scale(d.bin.x0) - chart.y.scale(d.bin.x1))
                        .attr("width", d => chart.bandwidth(d.bin.length) - chart.bandwidth(-d.bin.length))),
                exit => exit)
    };
}

interface IAdminControlInteractions extends IAdminControlTransitions {
    tooltip: ITooltip;
    zoom: IZoom;
}

class AdminControlInteractions extends AdminControlTransitions implements IAdminControlInteractions {
    tooltip = new Tooltip();
    zoom = new Zoom();
}

// Basic interface for tooltip content interaction
interface ITooltipValues {
    label: string;
    value: number | string;
}

// Basic class for tooltip content interaction
class TooltipValues implements ITooltipValues {
    label: string;
    value: number | string;
    constructor(label?: string, value?: number | string) {
        this.label = label == undefined ? "" : label;
        this.value = value == undefined ? 0 : value;
    }
}

// Interface for tooltip interaction
interface ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void;
    removeTooltip(chart: IChart): void
    appendTooltipContainer(chart: IChart): void;
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[]): d3.Selection<SVGRectElement, unknown, HTMLElement, any>;
    positionTooltipContainer(chart: IChart, x: number, y: number): void;
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number, colour: string): void;
}

// Class for tooltip interaction
class Tooltip implements ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void {
        chart.elements.content.on("mouseover", onMouseover)
        chart.elements.content.on("mouseout", onMouseout);
    };
    removeTooltip(chart: IChart): void {
        chart.elements.contentContainer.selectAll(".tooltip-container").remove();
        chart.elements.contentContainer.selectAll(".tooltip-line").remove();
    };
    appendTooltipContainer(chart: IChart): void {
        chart.elements.contentContainer.append("g")
            .attr("class", "tooltip-container");
    };
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[] = null): d3.Selection<SVGRectElement, unknown, HTMLElement, any> {
        let result = chart.elements.contentContainer.select<SVGRectElement>(".tooltip-container").append("rect")
            .attr("class", "tooltip-box");
        let text = chart.elements.contentContainer.select(".tooltip-container").append("text")
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
        return result.attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5);
    };
    positionTooltipContainer(chart: IChart, x: number, y: number): void {
        chart.elements.contentContainer.select(".tooltip-container")
            .attr("transform", `translate(${x}, ${y})`)
            .transition()
            .style("opacity", 1);
    };
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number, colour: string): void {
        chart.elements.contentContainer.append("line")
            .attr("class", "tooltip-line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .style("stroke", colour);
    };
}

// Interface for zoom interaction
interface IZoom {
    enableZoom(chart: ChartTime, zoomed: any): void;
    appendZoomBar(chart: ChartTime): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}

// Class for zoom interaction
class Zoom implements IZoom {
    enableZoom(chart: ChartTime, zoomed: any): void {
        chart.elements.svg.selectAll(".zoom-rect")
            .attr("class", "zoom-rect active");

        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .on("zoom", zoomed);

        chart.elements.contentContainer.select(".zoom-rect").call(zoom);
    };
    appendZoomBar(chart: ChartTime): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
        return chart.elements.svg.append("g")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - 30})`);
    };
}

/* ------------------------------------------------
    End of admin control interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of admin experimental interfaces and classes 
-------------------------------------------------- */

interface IAdminExperimentalCharts extends IAdminControlCharts {
    histogram: IHistogramChartSeries;
    usersHistogram: IHistogramChartSeries;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted: string;
    allEntries: IAnalyticsChartsData[];
    handleGroups(boxPlot: ChartSeries): void;
    handleGroupsColours(chart: ChartSeries): void;
    handleGroupsSort(boxPlot: ChartSeries): void;
    getGroupCompareData(data: IAnalyticsChartsData[], id: string): IAnalyticsChartsData[];
    renderGroupCompare(data: IAnalyticsChartsData[], id: string): d3.Selection<HTMLDivElement, unknown, d3.BaseType, any>;
    handleGroupCompare(data: IAnalyticsChartsData[], compareData: IAnalyticsChartsData[]): void;
}

class AdminExperimentalCharts extends AdminControlCharts implements IAdminExperimentalCharts {
    histogram: HistogramChartSeries;
    usersHistogram: HistogramChartSeries;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted = "date";
    allEntries: IAnalyticsChartsData[];
    interactions = new AdminExperimentalInteractions();
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[] {
        d3.select("#groups")
            .selectAll("li")
            .data(allEntries)
            .enter()
            .append("li")
            .html(d => `<div class="input-group mb-1">
                                <div class="input-group-prepend">
                                    <div class="input-group-text group-row">
                                        <input type="checkbox" value="${d.group}" ${d.selected ? "checked" : ""} />
                                    </div>                               
                                </div>
                                <input type="text" value="${d.group}" class="form-control group-row" disabled />
                                <div class="input-group-append">
                                    <div class="input-group-text group-row">
                                        <input type="color" value="${d.colour}" id="colour-${d.group}" />
                                    </div>                                
                                </div>
                            </div>  `);
        this.allEntries = allEntries;
        return d3.filter(allEntries, d => d.selected == true);
    };
    handleGroups(boxPlot: ChartSeries): void {
        let _this = this;
        function updateData(chart: ChartSeries): IAnalyticsChartsDataStats[] {
            let entries = d3.filter(_this.allEntries, d => d.selected);
            let data = entries.map(d => new AnalyticsChartsDataStats(d));
            chart.x.scale.domain(data.map(d => d.group));
            return data;
        };
        function updateGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]) {
            _this.interactions.axisSeries(chart, data);
            _this.renderGroupChart(chart, data);
        }
        d3.selectAll("#groups input[type=checkbox]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            if (target.checked) {
                _this.allEntries.find(d => d.group == target.value).selected = true;
                let data = updateData(boxPlot);
                updateGroupChart(boxPlot, data);
                if (boxPlot.click) {
                    let clickData = boxPlot.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IAnalyticsChartsDataStats;
                    _this.interactions.click.appendGroupsText(boxPlot, data, clickData);
                    _this.getGroupCompareData();
                    _this.renderGroupCompare();
                    _this.handleGroupCompare();
                }
            } else {
                _this.allEntries.find(d => d.group == target.value).selected = false;
                let data = updateData(boxPlot);
                updateGroupChart(boxPlot, data);
                if (boxPlot.click) {
                    if (target.value == d3.select("#groups-statistics .card").attr("id")) {
                        _this.interactions.click.removeClick(boxPlot);
                        _this.htmlContainers.remove();
                    } else {
                        let clickData = boxPlot.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IAnalyticsChartsDataStats;
                        _this.interactions.click.appendGroupsText(boxPlot, data, clickData);
                        let histogramData = _this.getGroupCompareData();
                        _this.renderGroupCompare();
                        _this.histogram.x.scale.domain(histogramData.map(r => r.group));
                        _this.usersHistogram.x.scale.domain(histogramData.map(r => r.group));
                        _this.handleGroupCompare();
                        _this.renderHistogram(_this.histogram, histogramData);
                        _this.renderHistogram(_this.usersHistogram, histogramData);
                        _this.interactions.axisSeries(_this.histogram, histogramData);
                        _this.interactions.axisSeries(_this.usersHistogram, histogramData);
                    }
                }
            }
            _this.htmlContainers.removeHelp(boxPlot);
        });
    };
    handleGroupsColours(boxPlot: ChartSeries): void {
        let _this = this;
        d3.selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-", "");
            _this.allEntries.find(d => d.group == groupId).colour = target.value;
            let entries = d3.filter(_this.allEntries, d => d.selected);
            let data = entries.map(d => new AnalyticsChartsDataStats(d));
            _this.renderGroupChart(boxPlot, data);
            if (boxPlot.click) {
                let currentClickGroup = d3.select("#groups-statistics .card").attr("id");
                let histogramData = _this.getGroupCompareData();
                if (histogramData.map(d => d.group).includes(groupId)) {
                    _this.renderHistogram(_this.histogram, histogramData);
                    let usersData = histogramData.map(d => d.getUsersData());
                    _this.renderHistogram(_this.usersHistogram, usersData);
                    _this.handleGroupCompare();
                }
                if (currentClickGroup == groupId) {
                    if (_this.timeline.elements.contentContainer.selectAll(`#${_this.timeline.id}-timeline-contours`).empty()) {
                        _this.renderTimelineScatter(_this.timeline, _this.timelineZoom, _this.allEntries.find(d => d.group == groupId));
                    } else {
                        _this.timeline.elements.contentContainer.selectAll(`#${_this.timeline.id}-timeline-contours`).remove();
                        _this.renderTimelineDensity(_this.timeline, _this.allEntries.find(d => d.group == groupId));
                    }
                    _this.handleTimelineButtons(_this.timeline, _this.timelineZoom, _this.allEntries.find(d => d.group == groupId));
                }
            }
        });
    };
    handleGroupsSort(boxPlot: ChartSeries): void {
        let _this = this;
        d3.select("#groups-chart #sort-by").on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            _this.allEntries = _this.allEntries.sort(function (a, b) {
                if (selectedOption == "date") {
                    return _this.interactions.sort.sortData(a.creteDate, b.creteDate, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "name") {
                    return _this.interactions.sort.sortData(a.group, b.group, _this.sorted == "name" ? true : false);
                } else if (selectedOption == "mean") {
                    return _this.interactions.sort.sortData(d3.mean(a.value.map(d => d.point)), d3.mean(b.value.map(d => d.point)), _this.sorted == "mean" ? true : false);
                }
            });
            _this.sorted = _this.interactions.sort.setSorted(_this.sorted, selectedOption);
            let entries = d3.filter(_this.allEntries, d => d.selected);
            let data = entries.map(d => new AnalyticsChartsDataStats(d));
            boxPlot.x.scale.domain(data.map(r => r.group));
            _this.interactions.axisSeries(boxPlot, data);
            function getClickData(contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>){
                if (!contentContainer.select<SVGRectElement>(".clicked").empty()) {
                    return contentContainer.select<SVGRectElement>(".clicked").datum();
                } 
                return;
            }
            let groupClickData = getClickData(boxPlot.elements.contentContainer) as IAnalyticsChartsDataStats;
            _this.renderGroupChart(boxPlot, data);
            if (boxPlot.click) {              
                _this.interactions.click.appendGroupsText(boxPlot, data, groupClickData);
                let histogramData = _this.getGroupCompareData();
                _this.interactions.axisSeries(_this.histogram, histogramData);
                let histogramClickData = getClickData(_this.histogram.elements.contentContainer) as IHistogramData;
                _this.renderHistogram(_this.histogram, histogramData);
                let usersData = histogramData.map(d => d.getUsersData());
                _this.interactions.axisSeries(_this.usersHistogram, usersData);
                let usersHistogramClickData = getClickData(_this.usersHistogram.elements.contentContainer) as IHistogramData;
                _this.renderHistogram(_this.usersHistogram, usersData);
                if (_this.histogram.click) {
                    _this.interactions.click.appendThresholdPercentages(_this.histogram, histogramData, histogramClickData);
                }
                if (_this.usersHistogram.click) {                   
                    _this.interactions.click.appendThresholdPercentages(_this.usersHistogram, usersData, usersHistogramClickData);
                }
                _this.handleGroupCompare();
            }
            _this.htmlContainers.removeHelp(boxPlot);
        });
    };
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries {
        chart = super.renderGroupChart(chart, data);
        let _this = this
        _this.htmlContainers.renderNavbarScrollspy();
        _this.interactions.click.enableClick(chart, onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            _this.htmlContainers.remove();
        });
        _this.htmlContainers.boxPlot.select(".card-header button")
            .on("click", function (e: Event) {
                let showHelp = _this.htmlContainers.helpPopover(d3.select(this), `${chart.id}-help`);
                chart.elements.contentContainer.selectAll(`#${chart.id}-data`).attr("filter", showHelp ? "url(#f-help)" : null);
                _this.htmlContainers.helpPopover(chart.elements.contentContainer.select(`#${chart.id}-data`), `${chart.id}-help-data`, "hover or click me!");
                _this.htmlContainers.boxPlot.select("#sort-by")
                    .style("box-shadow", showHelp ? "5px 5px 15px #ffff00" : null);
                _this.htmlContainers.helpPopover(_this.htmlContainers.boxPlot.select("#sort-by"), `${chart.id}-help-button`, "click me!");
            });
        function onClick(e: Event, d: IAnalyticsChartsDataStats) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                _this.htmlContainers.remove();
                return;
            }
            _this.interactions.click.removeClick(chart);
            _this.htmlContainers.remove();
            chart.click = true;
            _this.interactions.click.appendGroupsText(chart, data, d);

            //Draw group statistics
            _this.htmlContainers.statistics = _this.htmlContainers.appendDiv("groups-statistics", "col-md-3");
            let groupsStatisticsCard = _this.htmlContainers.appendCard(_this.htmlContainers.statistics, `Statistics (${d.group})`, d.group);
            _this.renderGroupStats(groupsStatisticsCard, d)

            //Draw compare
            _this.htmlContainers.compare = _this.htmlContainers.appendDiv("group-compare", "col-md-2 mt-3");
            let compareCard = _this.htmlContainers.appendCard(_this.htmlContainers.compare, `Compare ${d.group} with:`);
            compareCard.select(".card-body").attr("class", "card-body");
            let histogramData = _this.getGroupCompareData();
            _this.renderGroupCompare();

            //Draw groups histogram container  
            _this.htmlContainers.histogram = _this.htmlContainers.appendDiv("group-histogram-chart", "col-md-5 mt-3");
            _this.htmlContainers.appendCard(_this.htmlContainers.histogram, `Reflections histogram (${d.group})`, undefined, true);
            _this.histogram = new HistogramChartSeries("group-histogram-chart", histogramData.map(d => d.group));
            _this.histogram = _this.renderHistogram(_this.histogram, histogramData);
            _this.htmlContainers.histogram.select(".card-header button")
                .on("click", function (e: Event) {
                    let showHelp = _this.htmlContainers.helpPopover(d3.select(this), `${_this.histogram.id}-help`);
                    _this.histogram.elements.contentContainer.selectAll(`#${_this.histogram.id}-data`).attr("filter", showHelp ? "url(#f-help)" : null);
                    _this.htmlContainers.helpPopover(_this.histogram.elements.contentContainer.select(`#${_this.histogram.id}-data`), `${_this.histogram.id}-help-data`, "hover or click me!");
                    let showDragHelp = _this.htmlContainers.helpPopover(_this.histogram.elements.contentContainer.select(".threshold-line.soaring"), `${_this.histogram.id}-help-drag`, "drag me!");
                    if (showDragHelp) {
                        d3.select(`#${_this.histogram.id}-help-drag`).style("top", parseInt(d3.select(`#${_this.histogram.id}-help-drag`).style("top")) - 19 + "px");
                    }
                });

            //Draw users histogram container
            _this.htmlContainers.userHistogram = _this.htmlContainers.appendDiv("group-histogram-users-chart", "col-md-5 mt-3");
            _this.htmlContainers.appendCard(_this.htmlContainers.userHistogram, `Users histogram (${d.group})`, undefined, true);
            let usersData = histogramData.map(d => d.getUsersData());
            _this.usersHistogram = new HistogramChartSeries("group-histogram-users-chart", histogramData.map(d => d.group));
            _this.usersHistogram = _this.renderHistogram(_this.usersHistogram, usersData);
            _this.htmlContainers.userHistogram.select(".card-header button")
                .on("click", function (e: Event) {
                    let showHelp = _this.htmlContainers.helpPopover(d3.select(this), `${_this.usersHistogram.id}-help`);
                    _this.usersHistogram.elements.contentContainer.selectAll(`#${_this.usersHistogram.id}-data`).attr("filter", showHelp ? "url(#f-help)" : null);
                    _this.htmlContainers.helpPopover(_this.usersHistogram.elements.contentContainer.select(`#${_this.usersHistogram.id}-data`), `${_this.usersHistogram.id}-help-data`, "hover or click me!");
                    let showDragHelp = _this.htmlContainers.helpPopover(_this.usersHistogram.elements.contentContainer.select(".threshold-line.soaring"), `${_this.usersHistogram.id}-help-drag`, "drag me!");
                    if (showDragHelp) {
                        d3.select(`#${_this.usersHistogram.id}-help-drag`).style("top", parseInt(d3.select(`#${_this.usersHistogram.id}-help-drag`).style("top")) - 19 + "px");
                    }
                });
            _this.handleGroupCompare();

            //Draw selected group timeline 
            _this.htmlContainers.timeline = _this.htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
            let timelineCard = _this.htmlContainers.appendCard(_this.htmlContainers.timeline, `Reflections vs Time (${d.group})`, undefined, true);
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
            _this.timeline = new ChartTime("group-timeline", d3.extent(d.value.map(d => d.timestamp)));
            _this.renderTimelineDensity(_this.timeline, d);
            _this.timelineZoom = new ChartTimeZoom(_this.timeline, d3.extent(d.value.map(d => d.timestamp)));
            _this.handleTimelineButtons(_this.timeline, _this.timelineZoom, d);
            _this.htmlContainers.timeline.select(".card-header button")
                .on("click", function (e: Event) {
                    let showHelp = _this.htmlContainers.helpPopover(d3.select(this), `${_this.timeline.id}-help`);
                    _this.timeline.elements.contentContainer.selectAll(`#${_this.timeline.id}-timeline-circles`).attr("filter", showHelp ? "url(#f-help)" : null);
                    _this.htmlContainers.timeline.select("#timeline-plot")
                        .style("box-shadow", showHelp ? "5px 5px 15px #ffff00" : null);
                    _this.htmlContainers.helpPopover(_this.htmlContainers.timeline.select("#timeline-plot"), `${_this.timeline.id}-help-button`, "click me!");
                    _this.htmlContainers.helpPopover(_this.htmlContainers.timeline.select(".zoom-rect.active"), `${_this.timeline.id}-help-zoom`, "zoom me!");
                    if (!_this.timeline.elements.contentContainer.select(`#${_this.timeline.id}-timeline-circles`).empty()) {
                        let showDataHelp = _this.htmlContainers.helpPopover(_this.timeline.elements.contentContainer.select(`#${_this.timeline.id}-timeline-circles`), `${_this.timeline.id}-help-data`, "hover or click me!");
                        if (showDataHelp) {
                            d3.select(`#${_this.timeline.id}-help-data`).style("top", parseInt(d3.select(`#${_this.timeline.id}-help-data`).style("top")) - 14 + "px");
                        }
                    }
                });

            _this.htmlContainers.removeHelp(chart);
            //Scroll
            document.querySelector("#groups-statistics").scrollIntoView({ behavior: 'smooth', block: 'start' });
            _this.htmlContainers.renderNavbarScrollspy();
        }
        return chart;
    };
    renderGroupStats(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsDataStats): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        super.renderGroupStats(div, data);
        let height = d3.select<HTMLDivElement, unknown>("#groups-chart .card").node().getBoundingClientRect().height;
        div.style("height", `${height}px`);
        return div;
    }
    renderHistogram(chart: HistogramChartSeries, data: IAnalyticsChartsData[]): HistogramChartSeries {
        let _this = this;
        chart = super.renderHistogram(chart, data);

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
            _this.htmlContainers.removeHelp(chart);
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
            chart.setBin();
            _this.interactions.histogram(chart, chart.elements.contentContainer.selectAll(`.${chart.id}-histogram-container`));
            d3.select(this).classed("grabbing", false);
            d3.select(this).classed("grab", true);
            _this.handleHistogramHover(chart);
            if (chart.click) {
                let clickData = chart.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData;
                _this.interactions.click.appendThresholdPercentages(chart, data, clickData);
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
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): ChartTime {
        let _this = this;
        chart = super.renderTimelineScatter(chart, zoomChart, data);
        //Enable click
        _this.interactions.click.enableClick(chart, onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
            _this.htmlContainers.removeUsers();
        });
        chart.elements.contentContainer.select(`#${chart.id}-timeline-circles-line`)
            .style("stroke", data.colour);
        function onClick(e: Event, d: IReflectionAuthorEntry) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
                d3.select("#analytics-navbar").select(`#${_this.htmlContainers.userStatistics.attr("id")}-li`).remove();
                _this.htmlContainers.removeUsers();
                return;
            }

            _this.interactions.click.removeClick(chart);
            chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
            //Remove users html containers
            _this.htmlContainers.removeUsers();
            chart.elements.content.attr("class", (data: IReflectionAuthorEntry) => `line-circle ${data.pseudonym == d.pseudonym ? "clicked" : ""}`);
            let userData = data.value.filter(c => c.pseudonym == d.pseudonym);

            let line = d3.line<IReflectionAuthorEntry>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point));

            chart.elements.contentContainer.append("path")
                .datum(d3.sort(userData, d => d.timestamp))
                .attr("class", "line")
                .attr("id", `${chart.id}-timeline-circles-line`)
                .attr("d", d => line(d))
                .style("stroke", data.colour);

            //Draw click containers
            userData.forEach(c => _this.interactions.click.appendScatterText(chart, c, c.point.toString()));

            //Draw user statistics container
            _this.htmlContainers.userStatistics = _this.htmlContainers.appendDiv("user-statistics", "col-md-12 mt-3");
            let userStatisticsCard = _this.htmlContainers.appendCard(_this.htmlContainers.userStatistics, `${d.pseudonym}'s statistics`);
            _this.renderUserStatistics(userStatisticsCard, data, d.pseudonym);

            _this.htmlContainers.removeHelp(chart);
            //Scroll
            document.querySelector("#group-timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
            _this.htmlContainers.renderNavbarScrollspy();
        }
        return chart;
    };
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData): ChartTime {
        chart = super.renderTimelineDensity(chart, data);
        this.interactions.click.removeClick(chart);
        return chart;
    };
    getGroupCompareData(): IAnalyticsChartsData[] {
        let currentGroupId = d3.select("#groups-statistics .card").attr("id");
        let compareData = [] as IAnalyticsChartsData[];
        d3.select("#group-compare .card-body").selectAll("div").each((d: IAnalyticsChartsData, i, g) => {
            d3.select(g[i]).select("input").property("checked") == false ? "" : compareData.push(d);
        });
        return this.allEntries.filter(d => compareData.map(x => x.group).includes(d.group) || d.group == currentGroupId);
    }
    renderGroupCompare(): d3.Selection<HTMLDivElement, unknown, d3.BaseType, any> {
        let currentGroupId = d3.select("#groups-statistics .card").attr("id");
        let compareData = this.allEntries.filter(d => d.selected && d.group != currentGroupId);
        let selectedGroupCompare = this.getGroupCompareData();
        d3.select("#group-compare .card-body").selectAll("div").remove();
        return d3.select("#group-compare .card-body").selectAll("div")
            .data(compareData)
            .enter()
            .append("div")
            .attr("class", "form-check")
            .html(d => `<input class="form-check-input" type="checkbox" value="${d.group}" id="compare-${d.group}" ${selectedGroupCompare.includes(d) ? "checked" : ""} />
            <label class="form-check-label" for="compare-${d.group}">${d.group}</label>`);
    };
    handleGroupCompare(): void {
        let _this = this;
        d3.selectAll("#group-compare input").on("change", (e: Event, d: IAnalyticsChartsData) => {
            let target = e.target as HTMLInputElement;
            let selectedCompareData = _this.getGroupCompareData();
            let groupData = d3.filter(_this.allEntries, d => selectedCompareData.includes(d));
            let usersData = groupData.map(d => d.getUsersData());
            _this.histogram.x.scale.domain(groupData.map(r => r.group));
            _this.usersHistogram.x.scale.domain(groupData.map(r => r.group));
            _this.interactions.axisSeries(_this.histogram, groupData);
            _this.interactions.axisSeries(_this.usersHistogram, usersData);
            _this.renderHistogram(_this.histogram, groupData);            
            _this.renderHistogram(_this.usersHistogram, usersData);
            _this.htmlContainers.removeHelp(_this.histogram);
            _this.htmlContainers.removeHelp(_this.usersHistogram);
            if (_this.histogram.click) {
                let clickData = _this.histogram.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData;
                if (!target.checked && clickData.group == target.value) {
                    _this.interactions.click.removeClick(_this.histogram);
                } else  {
                    _this.interactions.click.appendThresholdPercentages(_this.histogram, groupData, clickData);
                }
            }
            if (_this.usersHistogram.click) {
                let clickData = _this.histogram.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData;
                if (!target.checked && clickData.group == target.value) {
                    _this.interactions.click.removeClick(_this.usersHistogram);
                } else {
                    _this.interactions.click.appendThresholdPercentages(_this.usersHistogram, usersData, clickData);
                }
            }
        });
    };
    renderUserStatistics(card: any, data: IAnalyticsChartsData, pseudonym?: string): void {
        super.renderUserStatistics(card, data, pseudonym);
        let _this = this;
        card.selectAll("a")
            .on("click", (e: Event, d: IReflectionAuthorEntry) => {
                _this.interactions.click.removeClick(_this.timeline);
                _this.timeline.elements.content.attr("class", "line-circle");
                _this.timeline.elements.contentContainer.selectAll(`#${_this.timeline.id}-timeline-circles-line`).remove();
                _this.timeline.elements.content.attr("class", (data: IReflectionAuthorEntry) => `line-circle ${data.pseudonym == d.pseudonym ? "clicked" : ""}`);
                let userData = data.value.filter(c => c.pseudonym == d.pseudonym);
                let line = d3.line<IReflectionAuthorEntry>()
                    .x(d => _this.timeline.x.scale(d.timestamp))
                    .y(d => _this.timeline.y.scale(d.point));

                _this.timeline.elements.contentContainer.append("path")
                    .datum(d3.sort(userData, d => d.timestamp))
                    .attr("class", "line")
                    .attr("id", `${_this.timeline.id}-timeline-circles-line`)
                    .attr("d", d => line(d))
                    .style("stroke", data.colour);
                userData.forEach(c => _this.interactions.click.appendScatterText(_this.timeline, c, c.point.toString()));
                card.select(".card-header")
                    .html(`${d.pseudonym} statistics`);
                setTimeout(() => {
                    card.select(".scroll-list")
                    .transition()
                    .duration(750)
                    .style("height", `${card.select(".tab-pane.fade.show.active").node().getBoundingClientRect().height}px`)
                }, 250);
            })
    };
}

interface IAdminExperimentalInteractions extends IAdminControlInteractions {
    click: IClick;
    sort: ISort;
}

class AdminExperimentalInteractions extends AdminControlInteractions implements IAdminExperimentalInteractions {
    click = new Click();
    sort = new Sort();
}

// Interface for click interaction
interface IClick {
    enableClick(chart: IChart, onClick: any): void;
    removeClick(chart: IChart): void;
    appendScatterText(chart: IChart, d: IReflectionAuthorEntry, title: string, values: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthorEntry): string;
    appendGroupsText(chart: ChartSeries, data: IAnalyticsChartsDataStats[], clickData: IAnalyticsChartsDataStats): void;
    appendThresholdPercentages(chart: HistogramChartSeries, data: IAnalyticsChartsData[], clickData: IHistogramData): void;
}

// Class for click interaction
class Click implements IClick {
    enableClick(chart: IChart, onClick: any): void {
        chart.elements.content.on("click", onClick);
    };
    removeClick(chart: IChart): void {
        chart.click = false;
        chart.elements.contentContainer.selectAll(".click-text").remove();
        chart.elements.contentContainer.selectAll(".click-line").remove();
        chart.elements.contentContainer.selectAll(".click-container").remove()
        chart.elements.content.classed("clicked", false);
    };
    appendScatterText(chart: ChartTime, d: IReflectionAuthorEntry, title: string, values: ITooltipValues[] = null): void {
        let container = chart.elements.contentContainer.append("g")
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
    };
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthorEntry): string {
        let positionX = chart.x.scale(d.timestamp);
        let positionY = chart.y.scale(d.point) - box.node().getBBox().height - 10;
        if (chart.width - chart.padding.yAxis < chart.x.scale(d.timestamp) + text.node().getBBox().width) {
            positionX = chart.x.scale(d.timestamp) - box.node().getBBox().width;
        };
        if (chart.y.scale(d.point) - box.node().getBBox().height - 10 < 0) {
            positionY = positionY + box.node().getBBox().height + 20;
        };
        return `translate(${positionX}, ${positionY})`;
    };
    appendGroupsText(chart: ChartSeries, data: IAnalyticsChartsDataStats[], clickData: IAnalyticsChartsDataStats): void {
        chart.elements.content.classed("clicked", (d: IAnalyticsChartsDataStats) => d.group == clickData.group);

        chart.elements.contentContainer.selectAll<SVGGElement, unknown>(".click-container")
            .data(data)
            .join(
                enter => enter .append("g")
                    .attr("class", "click-container")
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`)
                    .call(enter => enter.selectAll("text")
                        .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
                        .enter()
                        .append("text")
                        .attr("class", "click-text black")                       
                        .attr("y", c => chart.y.scale((c.data.stat as IDataStats).value as number) - 5)
                        .text(c => `${(c.data.stat as IDataStats).displayName}: ${(c.data.stat as IDataStats).value} `)
                        .append("tspan")
                        .attr("class", c => this.comparativeText(c)[0])
                        .text(c => `(${this.comparativeText(c)[1]})`)),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
                    .call(update => update.selectAll("text")
                    .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
                        .join(
                            enter => enter,
                            update => update.call(text => text.selectAll<SVGTSpanElement, ClickTextData>("tspan")
                                    .attr("class", c => this.comparativeText(c)[0])
                                    .text(c => `(${this.comparativeText(c)[1]})`))
                                .call(update => update.transition()
                                    .duration(750)
                                    .attr("class", "click-text black")
                                    .attr("y", c => chart.y.scale((c.data.stat as IDataStats).value as number) - 5)
                                    .text(c => `${(c.data.stat as IDataStats).displayName}: ${(c.data.stat as IDataStats).value} `)),
                            exit => exit
                        )),
                exit => exit.remove()
            );
    };
    appendThresholdPercentages(chart: HistogramChartSeries, data: IAnalyticsChartsData[], clickData: IHistogramData): void {
        let thresholds = chart.elements.getThresholdsValues(chart);
        let tDistressed = thresholds[0];
        let tSoaring = thresholds[1];

        chart.elements.content.classed("clicked", (d: IHistogramData) => d.group == clickData.group && clickData.bin.length - d.bin.length == 0);

        chart.elements.contentContainer.selectAll<SVGGElement, unknown>(".click-container")
            .data(data)
            .join(
                enter => enter .append("g")
                    .attr("class", "click-container")
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`)
                    .call(enter => enter.selectAll("text")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .enter()
                        .append("text")
                        .attr("class", c => this.comparativeText(new ClickTextData(clickData.bin.length, c.bin.length, clickData.group, c.group))[0])
                        .attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
                        .text(c => `${this.comparativeText(new ClickTextData(clickData.bin.length, c.bin.length, clickData.group, c.group))[1]} (${Math.abs(clickData.percentage - c.percentage)}%)`)),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
                    .call(update => update.selectAll("text")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .join(
                            enter => enter,
                            update => update.call(update => update.transition()
                                .duration(750)
                                .attr("class", c => this.comparativeText(new ClickTextData(clickData.bin.length, c.bin.length, clickData.group, c.group))[0])
                                .attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
                                .text(c => `${this.comparativeText(new ClickTextData(clickData.bin.length, c.bin.length, clickData.group, c.group))[1]} (${Math.abs(clickData.percentage - c.percentage)}%)`)),
                            exit => exit
                        )),
                exit => exit.remove()
            );       
    };
    private comparativeText(textData: IClickTextData): string[] {
        let textClass = "click-text";
        let textSymbol = "";
        let textValue;
        if (typeof(textData.clickData.stat) != "number" && typeof(textData.data.stat) != "number") {
            textValue = (textData.clickData.stat.value as number) - (textData.data.stat.value as number)
        } else {
            textValue = (textData.clickData.stat as number) - (textData.data.stat as number)
        }

        if (textValue < 0) {
            textClass = textClass + " positive";
            textSymbol = "+";
        }
        else if (textValue > 0) {
            textClass = textClass + " negative";
            textSymbol = "-";
        }
        else {
            textClass = textClass + " black"
        }

        if (textData.clickData.group != null && textData.data.group != null) {
            return [textClass, `${textSymbol}${textData.clickData.group == textData.data.group 
                && textValue == 0 ? typeof(textData.clickData.stat) != "number" ? textData.clickData.stat.value : textData.clickData.stat : (Math.abs(textValue))}`];
        } else {
            return [textClass, `${textSymbol}${(Math.abs(textValue))}`];
        }
    }
}

// Interface for sort interaction
interface ISort {
    sortData(a: number, b: number, sorted: boolean): number;
    setSorted(sorted: string, option: string): string;
}

// Class for sort interaction
class Sort implements ISort {
    sortData(a: number | Date | string, b: number | Date | string, sorted: boolean): number {
        if (a < b) {
            if (sorted) {
                return -1;
            } else {
                return 1;
            }
        } if (a > b) {
            if (sorted) {
                return 1;
            } else {
                return -1;
            }
        }
        return 0;
    };
    setSorted(sorted: string, option: string): string {
        return sorted == option ? "" : option;
    }
}

/* ------------------------------------------------
    End of admin experimental interfaces and classes
-------------------------------------------------- */

export function buildControlAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]) {
    let rawData = entriesRaw.map(d => new AnalyticsChartsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    let colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map(d => new AnalyticsChartsData(d.group, d.value, d.creteDate, colourScale(d.group), d.selected));
    drawCharts(entries);
    function drawCharts(allEntries: IAnalyticsChartsData[]) {
        let adminControlCharts = new AdminControlCharts();
        //Handle sidebar button
        adminControlCharts.sidebarBtn();
        adminControlCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = allEntries.map(d => new AnalyticsChartsDataStats(d));

        //Append groups chart container
        adminControlCharts.htmlContainers.boxPlot = adminControlCharts.htmlContainers.appendDiv("groups-chart", "col-md-9");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.boxPlot, "Reflections box plot", undefined, true);

        //Create groups chart with current data
        let groupChart = new ChartSeries("groups-chart", data.map(d => d.group));
        adminControlCharts.renderGroupChart(groupChart, data);

        //Handle groups chart help
        adminControlCharts.htmlContainers.boxPlot.select(".card-header button")
            .on("click", function (e: Event) {
                let showHelp = adminControlCharts.htmlContainers.helpPopover(d3.select(this), `${groupChart.id}-help`);
                groupChart.elements.contentContainer.selectAll(`#${groupChart.id}-data`).attr("filter", showHelp ? "url(#f-help)" : null);
                adminControlCharts.htmlContainers.helpPopover(groupChart.elements.contentContainer.select(`#${groupChart.id}-data`), `${groupChart.id}-help-data`, "hover me!");
            });

        //Append group general statistics
        adminControlCharts.htmlContainers.statistics = adminControlCharts.htmlContainers.appendDiv("groups-statistics", "col-md-3");
        adminControlCharts.htmlContainers.statistics.selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "card")
            .call(div => div.append("div")
                .attr("class", "card-header")
                .append("button")
                .attr("class", "btn btn-link")
                .attr("data-target", d => `#stats-${d.group}`)
                .attr("data-toggle", "collapse")
                .html(d => `${d.group} statistics`))
            .call(div => div.append("div")
                .attr("id", d => `stats-${d.group}`)
                .attr("class", (d, i) => `collapse ${i == 0 ? "show" : ""}`)
                .attr("data-parent", "#groups-statistics")
                .append("div")
                .attr("class", "card-body"))
            .call(div => adminControlCharts.renderGroupStats(div, div.datum()));

        //Draw groups histogram container  
        adminControlCharts.htmlContainers.histogram = adminControlCharts.htmlContainers.appendDiv("group-histogram-chart", "col-md-6 mt-3");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.histogram, `Reflections histogram`, undefined, true);
        let histogramChart = new HistogramChartSeries("group-histogram-chart", data.map(d => d.group));
        adminControlCharts.renderHistogram(histogramChart, data);

        //Handle histogram chart help
        adminControlCharts.htmlContainers.histogram.select(".card-header button")
            .on("click", function (e: Event) {
                let showHelp = adminControlCharts.htmlContainers.helpPopover(d3.select(this), `${histogramChart.id}-help`);
                histogramChart.elements.contentContainer.selectAll(`#${histogramChart.id}-data`).attr("filter", showHelp ? "url(#f-help)" : null);
                adminControlCharts.htmlContainers.helpPopover(histogramChart.elements.contentContainer.select(`#${histogramChart.id}-data`), `${histogramChart.id}-help-data`, "hover me!");
            });

        //Draw users histogram container
        adminControlCharts.htmlContainers.userHistogram = adminControlCharts.htmlContainers.appendDiv("group-histogram-users-chart", "col-md-6 mt-3");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.userHistogram, `Users histogram`, undefined, true);
        let usersData = data.map(d => d.getUsersData());
        let histogramUsersChart = new HistogramChartSeries("group-histogram-users-chart", data.map(d => d.group));
        adminControlCharts.renderHistogram(histogramUsersChart, usersData);

        //Handle users histogram chart help
        adminControlCharts.htmlContainers.userHistogram.select(".card-header button")
            .on("click", function (e: Event) {
                let showHelp = adminControlCharts.htmlContainers.helpPopover(d3.select(this), `${histogramUsersChart.id}-help`);
                histogramUsersChart.elements.contentContainer.selectAll(`#${histogramUsersChart.id}-data`).attr("filter", showHelp ? "url(#f-help)" : null);
                adminControlCharts.htmlContainers.helpPopover(histogramUsersChart.elements.contentContainer.select(`#${histogramUsersChart.id}-data`), `${histogramUsersChart.id}-help-data`, "hover me!");
            });

        //Draw timeline 
        adminControlCharts.htmlContainers.timeline = adminControlCharts.htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
        let timelineCard = adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.timeline, `Reflections vs Time`, undefined, true);
        timelineCard.select(".card-body")
            .attr("class", "card-body")
            .append("ul")
            .attr("class", "nav nav-tabs")
            .selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", (d, i) => `nav-link ${i == 0 ? "active" : ""}`)
            .attr("href", d => `#timeline-${d.group}`)
            .html(d => d.group);
        timelineCard.select(".card-body")
            .append("div")
            .attr("class", "row mt-3")
            .html(() => `<div id="timeline-plot" class="btn-group btn-group-toggle mr-auto ml-auto" data-toggle="buttons">
                            <label class="btn btn-light active">
                                <input type="radio" name="plot" value="density" checked>Density Plot<br>
                            </label>
                            <label class="btn btn-light">
                                <input type="radio" name="plot" value="scatter">Scatter Plot<br>
                            </label>
                        </div>`)
        timelineCard.append("div")
            .attr("class", "chart-container");

        let timelineChart = new ChartTime("group-timeline", d3.extent(data[0].value.map(d => d.timestamp)));
        adminControlCharts.renderTimelineDensity(timelineChart, data[0]);
        let timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(data[0].value.map(d => d.timestamp)));
        adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, data[0]);

        timelineCard.selectAll("a")
            .on("click", (e: Event, d: IAnalyticsChartsDataStats) => {
                timelineCard.selectAll("a")
                    .each((x: IAnalyticsChartsDataStats, i: number, g: any) => {
                        if (x == d) {
                            d3.select(g[i])
                                .attr("class", "nav-link active")
                        } else {
                            d3.select(g[i])
                                .attr("class", "nav-link")
                        }
                    });
                timelineChart.x.scale.domain(d3.extent(d.value.map(d => d.timestamp)));
                timelineZoomChart.x.scale.domain(d3.extent(d.value.map(d => d.timestamp)));
                adminControlCharts.interactions.axisTime(timelineChart, d);
                if (timelineChart.elements.contentContainer.selectAll(`#${timelineChart.id}-timeline-contours`).empty()) {
                    adminControlCharts.renderTimelineScatter(timelineChart, timelineZoomChart, d);
                } else {
                    timelineChart.elements.contentContainer.selectAll(`#${timelineChart.id}-timeline-contours`).remove();
                    adminControlCharts.renderTimelineDensity(timelineChart, d);
                }
                adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, d);
            });

        //Handle timeline chart help
        adminControlCharts.htmlContainers.timeline.select(".card-header button")
            .on("click", function (e: Event) {
                let showHelp = adminControlCharts.htmlContainers.helpPopover(d3.select(this), `${timelineChart.id}-help`);
                timelineChart.elements.contentContainer.selectAll(`#${timelineChart.id}-timeline-circles`).attr("filter", showHelp ? "url(#f-help)" : null);
                adminControlCharts.htmlContainers.timeline.select("#timeline-plot")
                    .style("box-shadow", showHelp ? "5px 5px 15px #ffff00" : null);
                adminControlCharts.htmlContainers.helpPopover(adminControlCharts.htmlContainers.timeline.select("#timeline-plot"), `${timelineChart.id}-help-button`, "click me!");
                adminControlCharts.htmlContainers.helpPopover(adminControlCharts.htmlContainers.timeline.select(".zoom-rect.active"), `${timelineChart.id}-help-zoom`, "zoom me!");
                if (!timelineChart.elements.contentContainer.select(`#${timelineChart.id}-timeline-circles`).empty()) {
                    let showDataHelp = adminControlCharts.htmlContainers.helpPopover(timelineChart.elements.contentContainer.select(`#${timelineChart.id}-timeline-circles`), `${timelineChart.id}-help-data`, "hover me!");
                    if (showDataHelp) {
                        d3.select(`#${timelineChart.id}-help-data`).style("top", parseInt(d3.select(`#${timelineChart.id}-help-data`).style("top")) - 14 + "px");
                    }
                }
            });

        //Draw users data
        adminControlCharts.htmlContainers.userStatistics = adminControlCharts.htmlContainers.appendDiv("user-statistics", "col-md-12 mt-3");
        let usersCards = adminControlCharts.htmlContainers.userStatistics.selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "card");
        usersCards.each((d, i, g) => {
            d3.select(g[i])
                .append("div")
                .attr("class", "card-header")
                .append("button")
                .attr("class", "btn btn-link")
                .attr("data-target", `#users-${d.group}`)
                .attr("data-toggle", "collapse")
                .html(`Users in ${d.group}`);
            d3.select(g[i])
                .append("div")
                .attr("id", `users-${d.group}`)
                .attr("class", `collapse ${i == 0 ? "show" : ""}`)
                .attr("data-parent", "#user-statistics")
                .append("div")
                .attr("class", "card-body");
            adminControlCharts.renderUserStatistics(d3.select(g[i]), d);
        });
        usersCards.selectAll("button")
            .on("click", function () {
                let buttonId = d3.select(this).attr("data-target");
                setTimeout(() => {
                    usersCards.select(`${buttonId} .scroll-list`)
                    .transition()
                    .duration(750)
                    .style("height", `${usersCards.select<HTMLElement>(`${buttonId} .tab-pane.fade.show.active`).node().getBoundingClientRect().height}px`)
                }, 250);
            });
        adminControlCharts.htmlContainers.renderNavbarScrollspy();
    }
}

export function buildExperimentAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]) {
    let rawData = entriesRaw.map(d => new AnalyticsChartsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    let colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map((d, i) => new AnalyticsChartsData(d.group, d.value, d.creteDate, colourScale(d.group), i == 0 ? true : false));
    drawCharts(entries);
    function drawCharts(allEntries: IAnalyticsChartsData[]) {
        let adminExperimentalCharts = new AdminExperimentalCharts();
        //Handle sidebar button
        adminExperimentalCharts.sidebarBtn();

        //Preloaded groups
        let entries = adminExperimentalCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = entries.map(d => new AnalyticsChartsDataStats(d));

        //Append groups chart container
        adminExperimentalCharts.htmlContainers.boxPlot = adminExperimentalCharts.htmlContainers.appendDiv("groups-chart", "col-md-9");
        let groupCard = adminExperimentalCharts.htmlContainers.appendCard(adminExperimentalCharts.htmlContainers.boxPlot, "Reflections box plot", undefined, true);
        groupCard.select(".card-body")
            .attr("class", "card-body")
            .html(`<div class="row">
                        <span class="mx-2"><small>Sort groups by:</small></span>
                        <div id="sort-by" class="btn-group btn-group-sm btn-group-toggle" data-toggle="buttons">
                            <label class="btn btn-light active">
                                <input type="radio" name="sort" value="date" checked>Create date<br>
                            </label>
                            <label class="btn btn-light">
                                <input type="radio" name="sort" value="name">Name<br>
                            </label>
                            <label class="btn btn-light">
                                <input type="radio" name="sort" value="mean">Mean<br>
                            </label>
                        </div>
                    </div>
                    <div class="chart-container"></div>`);

        //Create group chart with current data
        let groupChart = new ChartSeries("groups-chart", data.map(d => d.group));
        groupChart = adminExperimentalCharts.renderGroupChart(groupChart, data);

        //Update charts depending on group
        adminExperimentalCharts.handleGroups(groupChart);
        adminExperimentalCharts.handleGroupsColours(groupChart);
        adminExperimentalCharts.handleGroupsSort(groupChart);
    }
}