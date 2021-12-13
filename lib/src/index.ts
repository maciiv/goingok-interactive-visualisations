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
    constructor(group: string, value: IReflectionAuthorEntry[], createDate: Date = undefined, colour: string = undefined, selected: boolean = false) {
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
    value: number | Date;
}

class DataStats implements IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
    constructor(stat: string, displayName: string, value: number | Date){
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
        this.stats.push(new DataStats("iqr", "IQR", Math.round(d3.quantile(entries.value.map(r => r.point), 0.75) - d3.quantile(entries.value.map(r => r.point), 0.25)))) 
        this.stats.push(new DataStats("oldRef", "Oldest reflection", d3.min(entries.value.map(r => new Date(r.timestamp)))))
        this.stats.push(new DataStats("newRef", "Newest reflection", d3.max(entries.value.map(r => new Date(r.timestamp)))))
        this.stats.push(new DataStats("totalRef", "Total reflections", entries.value.length))
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
    x: ChartSeriesAxis | ChartTimeAxis | ChartLinearAxis;
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
        this.y = new ChartLinearAxis("Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
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
    help: IHelp;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, domain: Date[]) {
        this.id = id;
        let containerDimensions = d3.select<HTMLDivElement, unknown>(`#${id} .chart-container`).node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(75, 75, 5);
        this.help = new Help();
        this.y = new ChartLinearAxis("Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
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

// Basic class for user chart
class UserChart implements IChart {
    id: string;
    width: number;
    height: number;
    x: ChartLinearAxis;
    y: ChartLinearAxis;
    elements: IChartElements;
    padding: IChartPadding;
    click: boolean;
    constructor(id: string, containerClass: string) {
        this.id = id;
        let containerDimensions = d3.select<HTMLDivElement, unknown>(`#${id} .${containerClass}`).node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = 50;
        this.padding = new ChartPadding(20, 30, 10, 30);
        this.y = new ChartLinearAxis("", [0, 1], [20, 0], "left");
        this.x = new ChartLinearAxis("Reflection Point Average", [0, 100], [0, this.width - this.padding.yAxis - this.padding.right], "bottom");
        this.click = false;
        this.elements = new ChartElements(this, containerClass);
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
            .domain([-100, 100]);
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
        } else if (position == "bottom") {
            this.axis = d3.axisBottom(this.scale);
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
    constructor(chart: IChart, containerClass?: string) {
        this.svg = this.appendSVG(chart, containerClass);
        this.contentContainer = this.appendContentContainer(chart);
        this.xAxis = this.appendXAxis(chart);
        this.appendXAxisLabel(chart);
        this.yAxis = this.appendYAxis(chart);
        this.appendYAxisLabel(chart);
    }
    private appendSVG(chart: IChart, containerClass?: string): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
        return d3.select(`#${chart.id} ${containerClass == undefined ? ".chart-container" : "." + containerClass}`)
            .append("svg")
            .attr("class", "chart-svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${chart.width} ${chart.height}`);
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

// Interface for timeline data
interface ITimelineData extends IReflectionAuthorEntry {
    colour: string;
    group: string;
}

// Class for timeline data
class TimelineData implements ITimelineData {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
    colour: string;
    group: string;
    constructor(data: IReflectionAuthorEntry, colour: string, group: string) {
        this.timestamp = data.timestamp;
        this.pseudonym = data.pseudonym;
        this.point = data.point;
        this.text = data.text;
        this.colour = colour;
        this.group = group;
    }
}

// Interface for bin hover data
interface IHistogramData extends IAnalyticsChartsData {
    bin: d3.Bin<number, number>;
    percentage: number;
}

// Class for bin hover data
class HistogramData extends AnalyticsChartsData implements IHistogramData {    
    bin: d3.Bin<number, number>;
    percentage: number;
    constructor(value: IReflectionAuthorEntry[], group: string, colour: string, bin: d3.Bin<number, number>, percentage: number) {
        super(group, value, undefined, colour);
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
interface IHelp {
    helpPopover(button: any, id: string, content: string): boolean;
    removeHelp(chart: IChart): void;
}

// Basic class for Html containers
class Help implements IHelp {
    helpPopover(button: any, id: string, content: string): boolean {
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
                .html(content);
            popover.style("left", `${button.node().getBoundingClientRect().left - popover.node().getBoundingClientRect().width}px`);
            button.select("i")
                .attr("class", "fas fa-window-close")
            return true;
        } else {
            d3.select(`#${id}`).remove();
            button.select("i")
                .attr("class", "fas fa-question-circle")
            return false;
        }
    };
    removeHelp(chart: IChart): void {
        d3.select(`#${chart.id}-help`).remove();
        d3.select(`#${chart.id}-help-button`).remove();
        d3.select(`#${chart.id}-help-data`).remove();
        d3.select(`#${chart.id}-help-drag`).remove();
        d3.select(`#${chart.id}-help-zoom`).remove();
        d3.select(`#${chart.id} .card-title i`)
            .attr("class", "fas fa-question-circle");
    };
}

/* ------------------------------------------------
    End of charts interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of admin control interfaces and classes 
-------------------------------------------------- */

interface IAdminControlCharts {
    help: IHelp;
    interactions: IAdminControlInteractions;
    sidebarBtn(): void;
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[];
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries;
    renderHistogram(chart: HistogramChartSeries, data: IAnalyticsChartsData[]): HistogramChartSeries;
    handleHistogramHover(chart: HistogramChartSeries, bandwidth: d3.ScaleLinear<number, number, never>): void;
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData[]): ChartTime;
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData[]): ChartTime;
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData[], func?: Function): void;
    renderUserStatistics(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsData, thresholds: number[], timelineData?: ITimelineData): void;
}

class AdminControlCharts implements IAdminControlCharts {
    help = new Help();
    interactions = new AdminControlInteractions();
    sidebarBtn(): void {
        //Handle side bar btn click
        d3.select("#sidebar-btn").on("click", function () {
            let isActive = d3.select("#sidebar").attr("class").includes("active");
            d3.select("#sidebar")
                .classed("active", !isActive);
            d3.select(this)
                .classed("active", isActive);
        });
    };
    preloadGroups(allEntries: IAnalyticsChartsData[], enable: boolean = false): IAnalyticsChartsData[] {
        d3.select("#groups")
            .selectAll("li")
            .data(allEntries)
            .enter()
            .append("li")
            .append("div")
            .attr("class", "input-group mb-1")
            .call(div => div.append("div")
                .attr("class", "input-group-prepend")
                .call(div => div.append("div")
                    .attr("class", "input-group-text group-row")
                    .html((d, i) => ` <input type="checkbox" value="${d.group}" ${!enable ? "checked disabled" : i == 0 ? "checked" : ""} />`)))
            .call(div => div.append("input")
                .attr("type", "text")
                .attr("class", "form-control group-row")
                .attr("value", d => d.group)
                .property("disabled", true))
            .call(div => div.append("div")
                .attr("class", "input-group-append")
                .call(div => div.append("div")
                    .attr("class", "input-group-text group-row")
                    .html(d => `<input type="color" value="${d.colour}" id="colour-${d.group}" ${!enable ? "disabled" : ""} />`)));
        return allEntries;
    };
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries {
        d3.select(`#${chart.id} .card-title span`)
            .html()

        d3.select(`#${chart.id} .card-subtitle`)
            .html(data.length <= 1 ? "Add more group codes from the left bar" : "Click a group code to filter");

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
            let tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.group, d.stats.filter((c, i) => i < 4).map(c => new TooltipValues(c.displayName, c.value as number)));

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
    renderHistogram(chart: HistogramChartSeries, data: IAnalyticsChartsData[]): HistogramChartSeries {
        chart.setBandwidth(data);
        chart.setBin();

        d3.select(`#${chart.id} .card-subtitle`)
            .html(data.length == 1 ? `Filtering by <span class="badge badge-pill badge-info">${data[0].group} <i class="fas fa-window-close"></i></span>` :
                "");

        //Process histogram
        chart.elements.contentContainer.selectAll<SVGGElement, IAnalyticsChartsData>(`.${chart.id}-histogram-container`)
            .data(data)
            .join(
                enter => enter.append("g")
                    .attr("class", `${chart.id}-histogram-container`)
                    .attr("transform", d => `translate(${chart.x.scale(d.group)}, 0)`)
                    .call(enter => enter.selectAll(".histogram-rect")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .enter()
                        .append("rect")
                        .attr("id", `${chart.id}-data`)
                        .attr("class", "histogram-rect")
                        .attr("x", c => chart.bandwidth(-c.percentage))
                        .attr("y", c => chart.y.scale(c.bin.x0))
                        .attr("height", 0)
                        .attr("width", c => chart.bandwidth(c.percentage) - chart.bandwidth(-c.percentage))
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
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData[]): ChartTime {
        let _this = this;

        d3.select(`#${chart.id} .card-subtitle`)
            .classed("instructions", data.length <= 1)
            .classed("text-muted", data.length != 1)
            .html(data.length != 1 ? `The oldest reflection was on ${d3.min(data.map(d => d3.min(d.value.map(d => d.timestamp)))).toDateString()} in the group code ${data[d3.minIndex(data.map(d => d3.min(d.value.map(d => d.timestamp))))].group}, while
                the newest reflection was on ${d3.max(data.map(d => d3.max(d.value.map(d => d.timestamp)))).toDateString()} in the group code ${data[d3.maxIndex(data.map(d => d3.max(d.value.map(d => d.timestamp))))].group}` :
                `Filtering by <span class="badge badge-pill badge-info">${data[0].group} <i class="fas fa-window-close"></i></span>`);

        //Remove scatter plot
        chart.elements.contentContainer.selectAll(".circle").remove();
        chart.elements.svg.selectAll(".zoom-container").remove();
        chart.elements.contentContainer.selectAll(".click-line").remove();
        chart.elements.zoomSVG = undefined;
        chart.elements.zoomFocus = undefined;

        drawContours();

        //Draw contours function
        function drawContours() {
            chart.elements.content = chart.elements.contentContainer.selectAll<SVGGElement, IAnalyticsChartsData>(".timeline-container")
            .data(data)
            .join(
                enter => enter.append("g")
                    .attr("class", "timeline-container")
                    .attr("stroke", d => d.colour)
                    .attr("fill", d => d.colour)
                    .call(enter =>_this.interactions.timelineDensity(enter, getDensityData)),
                update => update.attr("stroke", d => d.colour)
                    .attr("fill", d => d.colour)
                    .call(update => _this.interactions.timelineDensity(update, getDensityData)),
                exit => exit.remove());

            function getDensityData(data: IAnalyticsChartsData): d3.ContourMultiPolygon[] {
                return d3.contourDensity<IReflectionAuthorEntry>()
                    .x(d => chart.x.scale(d.timestamp))
                    .y(d => chart.y.scale(d.point))
                    .bandwidth(5)
                    .thresholds(20)
                    .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])
                    (data.value);
            }
        }
       

        //Enable zoom
        this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
            chart.x.scale.rangeRound(newChartRange);

            drawContours();

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
            _this.help.removeHelp(chart);
        }
        return chart;
    };
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData[]): ChartTime {
        //Remove density plot
        chart.elements.contentContainer.selectAll(".contour").remove();

        let _this = this;
        d3.select(`#${chart.id} .card-subtitle`)
            .classed("instructions", data.length <= 1)
            .classed("text-muted", data.length != 1)
            .html(data.length != 1 ? `The oldest reflection was on ${d3.min(data.map(d => d3.min(d.value.map(d => d.timestamp)))).toDateString()} in the group code ${data[d3.minIndex(data.map(d => d3.min(d.value.map(d => d.timestamp))))].group}, while
                the newest reflection was on ${d3.max(data.map(d => d3.max(d.value.map(d => d.timestamp)))).toDateString()} in the group code ${data[d3.maxIndex(data.map(d => d3.max(d.value.map(d => d.timestamp))))].group}` :
                `Filtering by <span class="badge badge-pill badge-info">${data[0].group} <i class="fas fa-window-close"></i></span>`);

        //Draw circles
        chart.elements.contentContainer.selectAll<SVGGElement, IAnalyticsChartsData>(".timeline-container")
        .data(data)
        .join(
            enter => enter.append("g")
                .attr("class", "timeline-container")
                .call(enter => _this.interactions.timelineScatter(enter, chart)),
            update => update.call(update => _this.interactions.timelineScatter(update, chart)),
            exit => exit.remove())     

        chart.elements.content = chart.elements.contentContainer.selectAll(".circle");

        //Enable tooltip       
        _this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e: Event, d: ITimelineData) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            _this.interactions.tooltip.appendTooltipContainer(chart);
            let tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.timestamp.toDateString(), 
                [new TooltipValues("User", d.pseudonym), 
                 new TooltipValues("Point", d.point)]);
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

            _this.interactions.tooltip.appendLine(chart, 0, chart.y.scale(d.point), chart.x.scale(d.timestamp), chart.y.scale(d.point), d.colour);
            _this.interactions.tooltip.appendLine(chart, chart.x.scale(d.timestamp), chart.y.scale(0), chart.x.scale(d.timestamp), chart.y.scale(d.point), d.colour);
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
        chart.elements.zoomFocus.selectAll<SVGGElement, IAnalyticsChartsData>(".zoom-timeline-content-container")
            .data(data)
            .join(
                enter => enter.append("g")
                    .attr("class", "zoom-timeline-content-container")
                    .call(enter => _this.interactions.timelineScatter(enter, zoomChart, true, true)),
                update => update.call(update => _this.interactions.timelineScatter(update, zoomChart, true, true)),
                exit => exit.remove());  
        
        chart.elements.zoomSVG.selectAll<SVGGElement, IAnalyticsChartsData>(".zoom-timeline-container")
            .data(data)
            .join(
                enter => enter.append("g")
                    .attr("class", "zoom-timeline-container")
                    .call(enter => { zoomChart.x.scale.rangeRound([0, chart.width - chart.padding.yAxis]); _this.interactions.timelineScatter(enter, zoomChart, true) }),
                update => update.call(update => { zoomChart.x.scale.rangeRound([0, chart.width - chart.padding.yAxis]); _this.interactions.timelineScatter(update, zoomChart, true) }),
                exit => exit.remove());
           
        //Enable zoom
        _this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
            chart.x.scale.rangeRound(newChartRange);
            zoomChart.x.scale.rangeRound([0, chart.width - chart.padding.yAxis - 5].map(d => e.transform.invertX(d)));
            let newLine = d3.line<IReflectionAuthorEntry>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point));

            chart.elements.contentContainer.selectAll<SVGCircleElement, IReflectionAuthorEntry>(".circle")
                .attr("cx", d => chart.x.scale(d.timestamp));

            chart.elements.zoomFocus.selectAll<SVGCircleElement, IReflectionAuthorEntry>(".zoom-content")
                .attr("cx", d => zoomChart.x.scale(d.timestamp));

            chart.elements.contentContainer.selectAll<SVGLineElement, IReflectionAuthorEntry[]>(".click-line")
                .attr("d", d => newLine(d));

            chart.elements.contentContainer.selectAll<SVGRectElement, IReflectionAuthorEntry>(".click-container")
                .attr("transform", d => `translate(${chart.x.scale(d.timestamp)}, ${chart.y.scale(d.point)})`);

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
            _this.help.removeHelp(chart);
        }
        return chart;
    };
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData[], func?: Function): void {
        let _this = this
        d3.select(`#${chart.id} #timeline-plot`).on("click", func != undefined ? (e: any) => func(e) : (e: any) => {
            var selectedOption = e.target.control.value;
            if (selectedOption == "density") {
                _this.renderTimelineDensity(chart, data);
            }
            if (selectedOption == "scatter") {
                _this.renderTimelineScatter(chart, zoomChart, data);
            }
            if (!d3.select(`#${chart.id}-help`).empty()) {
                _this.help.removeHelp(chart);
            }
        });
    };
    renderUserStatistics(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsData, thresholds: number[], timelineData?: ITimelineData): void {
        let _this = this;
        let userData = data.getUsersData();
        let groupMean = Math.round(d3.mean(data.value.map(d => d.point)));

        d3.select("#user-statistics .card-subtitle")
            .classed("text-muted", true)
            .classed("instructions", false)
            .html(timelineData == undefined ? `The user ${userData.value[d3.minIndex(userData.value.map(d => d.point))].pseudonym} is the most distressed, while
                the user ${userData.value[d3.maxIndex(userData.value.map(d => d.point))].pseudonym} is the most soaring` :
                `The user ${timelineData.pseudonym} has a total of ${data.value.filter(d => d.pseudonym == timelineData.pseudonym).length} reflections between
                ${d3.min(data.value.filter(d => d.pseudonym == timelineData.pseudonym).map(d => d.timestamp)).toDateString()} and
                ${d3.max(data.value.filter(d => d.pseudonym == timelineData.pseudonym).map(d => d.timestamp)).toDateString()}`)

        card.selectAll("div")
            .data(timelineData == undefined ? userData.value : userData.value.filter(d => d.pseudonym == timelineData.pseudonym))
            .enter()
            .append("div")
            .attr("class", "row statistics-text")
            .attr("id", d => d.pseudonym)
            .call(div => div.append("div")
                .attr("class", "col-md-4")
                .call(div => div.append("h6")
                    .attr("class", "mb-0 mt-1")
                    .html(d => `${d.pseudonym} is`))
                .call(div => div.append("span")
                    .attr("class", "text-muted")
                    .html(d => `<b>${_this.getUserStatisticBinName(d, thresholds)}</b>`)))
            .call(div => div.append("div")
                .attr("class", "col-md-8 mt-1 user-chart"))
            .call(div => div.append("div")
                .attr("class", "col-md-12")
                .append("p")
                .attr("class", "mb-1")
                .html(d => `User ${d.pseudonym} reflections in chronological order:`))
            .call(div => div.append("ul")
                .attr("class", "pr-3")
                .selectAll("li")
                .data(d => d3.sort(d3.filter(data.value, x => x.pseudonym == d.pseudonym), r => r.timestamp))
                .enter()
                .append("li")
                .classed("reflection-selected", d => timelineData != undefined ? d.timestamp == timelineData.timestamp : false)
                .html(d => `<i>${d.timestamp.toDateString()} | Reflection point ${d.point}</i><br> ${d.text}`))
            .each((d, i, g) => drawUserChart(d3.select(d3.select(g[i]).node().parentElement).attr("id") + " #" + d3.select(g[i]).attr("id"), d));

        function drawUserChart(id: string, data: IReflectionAuthorEntry) {          
            let chart = new UserChart(id, "user-chart");
            chart.elements.svg.classed("chart-svg", false);
            chart.elements.svg.select(".y-axis").remove();
            chart.elements.svg.select(".x-axis").attr("clip-path", null);
            chart.elements.contentContainer.append("rect")
                .attr("class", "bar no-click")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", chart.y.scale(0))
                .attr("width", chart.x.scale(data.point))
                .style("stroke", userData.colour)
                .style("fill", userData.colour);
            chart.elements.contentContainer.append("line")
                .attr("class", "threshold-line")
                .attr("x1", chart.x.scale(groupMean))
                .attr("x2", chart.x.scale(groupMean))
                .attr("y1", chart.y.scale(1))
                .attr("y2", chart.y.scale(0))
                .style("stroke", userData.colour);
            chart.elements.contentContainer.append("text")
                .attr("x", chart.x.scale(groupMean))
                .attr("y", chart.y.scale(1))
                .attr("font-size", 10)
                .attr("font-family", "sans-serif")
                .attr("text-anchor", "middle")
                .text(`Group average: ${groupMean}`);
            chart.elements.contentContainer.append("text")
                .attr("x", chart.x.scale(data.point))
                .attr("y", chart.y.scale(0.5))
                .attr("font-family", "sans-serif")
                .style("dominant-baseline", "central")
                .text(data.point);
        }
    };
    protected getUserStatisticBinName(data: IReflectionAuthorEntry, thresholds: number[]): string {
        let distressed = thresholds[0];
        let soaring = thresholds[1];
        if (data.point <= distressed) {
            return "Distressed";
        } else if (data.point >= soaring) {
            return "Soaring"
        } else {
            return "GoingOK"
        }
    }
}

interface IAdminControlTransitions {
    axisSeries(chart: ChartSeries, data: IAnalyticsChartsData[]): void;
    axisTime(chart: ChartTime, data: IAnalyticsChartsData[]): void;
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>): void;
    timelineDensity(update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>, getDensityData: Function): void;
    timelineScatter(update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom?: boolean, invisible?: boolean): void;
}

class AdminControlTransitions implements IAdminControlTransitions {
    axisSeries(chart: ChartSeries, data: IAnalyticsChartsData[]): void {
        chart.x.scale.domain(data.map(d => d.group));
        d3.select<SVGGElement, unknown>(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    axisTime(chart: ChartTime, data: IAnalyticsChartsData[]): void {
        chart.x.scale.domain([d3.min(data.map(d => d3.min(d.value.map(d => d.timestamp)))), d3.max(data.map(d => d3.max(d.value.map(d => d.timestamp))))]);
        d3.select<SVGGElement, unknown>(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    histogram(chart: HistogramChartSeries, update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>): void {        
        update.selectAll(".histogram-rect")
            .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
            .join(
                enter => enter,
                update => update.style("stroke", d => d.colour)
                    .style("fill", d => d.colour)
                    .call(update => update.transition()
                        .duration(750)
                        .attr("x", d => chart.bandwidth(-d.percentage))
                        .attr("y", d => chart.y.scale(d.bin.x1))
                        .attr("height", d => chart.y.scale(d.bin.x0) - chart.y.scale(d.bin.x1))
                        .attr("width", d => chart.bandwidth(d.percentage) - chart.bandwidth(-d.percentage))),
                exit => exit)
    };
    timelineDensity(update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>, getDensityData: Function): void {
        update.selectAll(".contour")
            .data(d => getDensityData(d))
            .join(
                enter => enter.append("path")
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())               
                    .attr("opacity", (d: d3.ContourMultiPolygon) => d.value * 25),
                update => update.attr("d", d3.geoPath())
                    .attr("opacity", (d: d3.ContourMultiPolygon) => d.value * 20),
                exit => exit.remove());
    };
    timelineScatter(update: d3.Selection<SVGGElement, IAnalyticsChartsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom = false, invisible = false): void {
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
    boxPlot: ChartSeries;
    histogram: IHistogramChartSeries;
    usersHistogram: IHistogramChartSeries;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted: string;
    allEntries: IAnalyticsChartsData[];
    handleGroups(): void;
    handleGroupsColours(): void;
    handleGroupsSort(): void;
    handleFilterButton(): void;
}

class AdminExperimentalCharts extends AdminControlCharts implements IAdminExperimentalCharts {
    boxPlot: ChartSeries;
    histogram: HistogramChartSeries;
    usersHistogram: HistogramChartSeries;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted = "date";
    allEntries: IAnalyticsChartsData[];
    interactions = new AdminExperimentalInteractions();
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[] {
        super.preloadGroups(allEntries, true)
        this.allEntries = allEntries;
        return d3.filter(allEntries, d => d.selected == true);
    };
    handleGroups(): void {
        let _this = this;
        function updateGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]) {
            chart.x.scale.domain(data.map(d => d.group));
            _this.interactions.axisSeries(chart, data);
            _this.renderGroupChart(chart, data);
        }
        d3.selectAll("#groups input[type=checkbox]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            if (target.checked) {
                _this.allEntries.find(d => d.group == target.value).selected = true;
            } else {
                _this.allEntries.find(d => d.group == target.value).selected = false;
            }
            let data = _this.getUpdatedData();
            let clickData = _this.getClickData(_this.boxPlot.elements.contentContainer) as IAnalyticsChartsDataStats;
            updateGroupChart(_this.boxPlot, data);
            if (_this.boxPlot.click) {
                if (!target.checked && target.value == clickData.group) {
                    _this.interactions.click.removeClick(_this.boxPlot);
                    _this.updateTimeline(data);
                    _this.updateHistograms(data, data.map(d => d.getUsersData()), data.map(d => d.group));
                } else {
                    _this.interactions.click.appendGroupsText(_this.boxPlot, data, clickData);
                }
            } else {
                _this.updateTimeline(data);
                _this.updateHistograms(data, data.map(d => d.getUsersData()), data.map(d => d.group));
            }
            _this.removeAllHelp(_this.boxPlot);
        });
    };
    handleGroupsColours(): void {
        let _this = this;
        d3.selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-", "");
            _this.allEntries.find(d => d.group == groupId).colour = target.value;
            let data = _this.getUpdatedData();
            _this.renderGroupChart(_this.boxPlot, data);
            if (_this.boxPlot.click) {
                let clickData = _this.getClickData(_this.boxPlot.elements.contentContainer) as IAnalyticsChartsDataStats;
                if (clickData.group == groupId) {
                    _this.updateTimeline([_this.allEntries.find(d => d.group == groupId)]);
                    _this.updateHistograms([clickData], [clickData.getUsersData()]);
                }
            } else {
                _this.updateTimeline(data);
                _this.updateHistograms(data, data.map(d => d.getUsersData()));
            }
        });
    };
    handleGroupsSort(): void {
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
            let data = _this.getUpdatedData();
            _this.boxPlot.x.scale.domain(data.map(r => r.group));
            _this.interactions.axisSeries(_this.boxPlot, data);
            let groupClickData = _this.getClickData(_this.boxPlot.elements.contentContainer) as IAnalyticsChartsDataStats;
            _this.renderGroupChart(_this.boxPlot, data);
            if (_this.boxPlot.click) {              
                _this.interactions.click.appendGroupsText(_this.boxPlot, data, groupClickData);               
            } else {
                _this.updateHistograms(data, data.map(d => d.getUsersData()), data.map(r => r.group));
            }
            _this.removeAllHelp(_this.boxPlot);
        });
    };
    handleFilterButton(): void {
        let data = this.getUpdatedData();
        this.interactions.click.removeClick(this.boxPlot);
        this.updateHistograms(data, data.map(d => d.getUsersData()), data.map(d => d.group));
        this.updateTimeline(data);
    };
    private getUpdatedData(): IAnalyticsChartsDataStats[] {
        return d3.filter(this.allEntries, d => d.selected).map(d => new AnalyticsChartsDataStats(d));
    };
    private getClickData(contentContainer: d3.Selection<SVGGElement, unknown, HTMLElement, any>): unknown {
        if (!contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").empty()) {
            return contentContainer.select<SVGRectElement | SVGCircleElement>(".clicked").datum();
        } 
        return;
    };
    private updateHistograms(data: IAnalyticsChartsData[], usersData: IAnalyticsChartsData[], scale?: string[]): void {
        if (scale != undefined) {
            this.histogram.x.scale.domain(scale);
            this.usersHistogram.x.scale.domain(scale);
        }
        this.renderHistogram(this.histogram, data);
        this.renderHistogram(this.usersHistogram, usersData);
        this.interactions.axisSeries(this.histogram, data);
        this.interactions.axisSeries(this.usersHistogram, usersData);
        if (this.histogram.click) {
            this.interactions.click.removeClick(this.histogram);
        }
        if (this.usersHistogram.click) {                   
            this.interactions.click.removeClick(this.usersHistogram);
        }
    };
    private updateTimeline(data: IAnalyticsChartsData[]): void {
        this.timeline.x.scale.domain([d3.min(data.map(d => d3.min(d.value.map(d => d.timestamp)))), d3.max(data.map(d => d3.max(d.value.map(d => d.timestamp))))]);
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
        d3.select("#user-statistics .card-title span")
            .html("Users compared to their group");
        d3.select("#user-statistics .card-subtitle")
            .classed("instructions", true)
            .classed("text-muted", false)
            .html("Select a reflection from the scatter plot to view specific users");
        d3.select("#user-statistics .users-tab-pane").remove();
    };
    private removeAllHelp(boxPlot: ChartSeries) {
        this.help.removeHelp(boxPlot);
        this.help.removeHelp(this.histogram);
        this.help.removeHelp(this.usersHistogram);
        this.help.removeHelp(this.timeline);
    }
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries {
        chart = super.renderGroupChart(chart, data);
        let _this = this
        _this.interactions.click.enableClick(chart, onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            _this.updateHistograms(data, data.map(d => d.getUsersData()), data.map(d => d.group));
            _this.updateTimeline(data);
        });
        function onClick(e: Event, d: IAnalyticsChartsDataStats) {
            if (d3.select(this).attr("class").includes("clicked")) {
                _this.interactions.click.removeClick(chart);
                _this.updateHistograms(data, data.map(d => d.getUsersData()), data.map(d => d.group));
                _this.updateTimeline(data);
                return;
            }
            _this.interactions.click.removeClick(chart);
            chart.click = true;
            _this.interactions.click.appendGroupsText(chart, data, d);
            _this.updateHistograms([d], [d.getUsersData()], data.filter(c => c.group == d.group).map(d => d.group));
            _this.updateTimeline([d]);
            _this.removeAllHelp(chart);
        }

        return chart;
    };
    renderHistogram(chart: HistogramChartSeries, data: IAnalyticsChartsData[]): HistogramChartSeries {
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
            chart.setBin();
            _this.interactions.histogram(chart, chart.elements.contentContainer.selectAll(`.${chart.id}-histogram-container`));
            d3.select(this).classed("grabbing", false);
            d3.select(this).classed("grab", true);
            _this.handleHistogramHover(chart);
            if (chart.click) {
                let clickData = chart.elements.contentContainer.select<SVGRectElement>(".clicked").datum() as IHistogramData;
                _this.interactions.click.appendThresholdPercentages(chart, data, clickData);
            }  
            if (chart.id == "group-histogram-users-chart" && !_this.timeline.elements.contentContainer.selectAll(".clicked").empty()) {
                let userData = _this.timeline.elements.contentContainer.selectAll<SVGCircleElement, IReflectionAuthorEntry>(".clicked").datum();
                let binName = _this.getUserStatisticBinName(data.map(d => d.value.find(d => d.pseudonym == userData.pseudonym))[0], chart.elements.getThresholdsValues(chart));
                d3.select(`#user-statistics #${userData.pseudonym} .text-muted`)
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
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData[]): ChartTime {
        let _this = this;
        chart = super.renderTimelineScatter(chart, zoomChart, data);
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
            chart.elements.content.classed("clicked", (data: IReflectionAuthorEntry) => data.pseudonym == d.pseudonym);
            d3.select(this)
                .classed("main", true);
            
            let userData = data.find(c => c.group == d.group).value.filter(c => c.pseudonym == d.pseudonym);

            let line = d3.line<IReflectionAuthorEntry>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point));

            chart.elements.contentContainer.append("path")
                .datum(d3.sort(userData, d => d.timestamp))
                .attr("class", "click-line")
                .attr("d", d => line(d))
                .style("stroke", d.colour);

            //Draw click containers
            userData.forEach(c => _this.interactions.click.appendScatterText(chart, c, c.point.toString()));

            //Draw user statistics container
            d3.select("#user-statistics .card-title span")
                .html(`User ${d.pseudonym} compared to their group`)
            let userCard = d3.select("#user-statistics .card-body")
                .append("div")
                .attr("class", "users-tab-pane")
                .attr("id", `user-statistics-${d.pseudonym}`);
            _this.renderUserStatistics(userCard, data.find(c => c.group == d.group), _this.usersHistogram.elements.getThresholdsValues(_this.usersHistogram), d);

            _this.help.removeHelp(chart);
            //Scroll
            document.querySelector("#group-timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return chart;
    };
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData[]): ChartTime {
        chart = super.renderTimelineDensity(chart, data);
        d3.select(`#${chart.id} .badge`).on("click", () => this.handleFilterButton());
        this.interactions.click.removeClick(chart);
        return chart;
    };
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData[]): void {
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
        chart.elements.contentContainer.selectAll(".click-container").remove();
        chart.elements.content.classed("clicked", false);
        chart.elements.content.classed("main", false);
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
                        .text(c => c.data.group != clickData.group ? `(${this.comparativeText(c)[1]})` : "")),
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
                    .call(update => update.selectAll("text")
                    .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
                        .join(
                            enter => enter,
                            update => update.attr("y", c => chart.y.scale((c.data.stat as IDataStats).value as number) - 5)
                                .text(c => `${(c.data.stat as IDataStats).displayName}: ${(c.data.stat as IDataStats).value} `)
                                .append("tspan")
                                .attr("class", c => this.comparativeText(c)[0])
                                .text(c => c.data.group != clickData.group ? `(${this.comparativeText(c)[1]})` : ""),
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
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .enter()
                        .append("text")
                        .attr("class", "click-text black")
                        .attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
                        .text(c => `${c.percentage}% ` )
                        .append("tspan")
                        .attr("class", c => this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[0])
                        .text(c => c.group != clickData.group && c.bin.x0 == clickData.bin.x0 && c.bin.x1 == clickData.bin.x1 ? `(${this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[1]})` : ""))
                        ,
                update => update.call(update => update.transition()
                    .duration(750)
                    .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
                    .call(update => update.selectAll("text")
                        .data(d => chart.bin(d.value.map(d => d.point)).map(c => { return new HistogramData(d.value, d.group, d.colour, c, Math.round(c.length / d.value.length * 100)) }))
                        .join(
                            enter => enter,
                            update => update.attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
                            .text(c => `${c.percentage}% ` )
                            .append("tspan")
                            .attr("class", c => this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[0])
                            .text(c => c.group != clickData.group && c.bin.x0 == clickData.bin.x0 && c.bin.x1 == clickData.bin.x1 ? `(${this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[1]})` : ""),
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

// Loading interfaces and classes
interface ILoading {
    isLoading: boolean;
    spinner: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    appendDiv():  d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    removeDiv(): void;
}

class Loading implements ILoading {
    isLoading: boolean;
    spinner: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    constructor() {
        this.isLoading = true;
        this.spinner = this.appendDiv();

    }
    appendDiv():  d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        let div = d3.select(".wrapper")
            .append("div")
            .attr("class", "loader")
        div.append("div")
            .attr("class", "loader-inner")
            .selectAll(".loader-line-wrap")
            .data([1, 2, 3, 4, 5])
            .enter()
            .append("div")
            .attr("class", "loader-line-wrap")
            .append("div")
            .attr("class", "loader-line");
        return div;
    }
    removeDiv(): void {
        this.spinner.remove();
    }
}

// Tutorial interfaces and classes
interface ITutorialData {
    id: string;
    content: string;
}

class TutorialData implements ITutorialData {
    id: string;
    content: string;
    constructor(id: string, content: string) {
        this.id = id;
        this.content = content;
    }
}

interface ITutorial {
    tutorial: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    tutorialData: ITutorialData[];
    slide: number;
    appendTutorial(id: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    removeTutorial(): void;
}

class Tutorial implements ITutorial {
    tutorial: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    tutorialData: ITutorialData[];
    slide: number;
    constructor(data: ITutorialData[]) {
        this.tutorial = this.appendTutorial();
        this.tutorialData = data;
        this.slide = 0;
        this.appendTutorialBackdrop();
    }
    appendTutorial(): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        d3.select("body")
            .classed("no-overflow", true);
        let div = d3.select(".wrapper")
            .append("div")
            .attr("class", "tutorial");
        return div;
    };
    private appendTutorialBackdrop(): void {
        if (this.slide >= this.tutorialData.length) {
            this.removeTutorial();
            return;
        }
        window.scroll(0, 0);
        let tutorialData = this.tutorialData[this.slide];
        let tutorialFocus = d3.select<HTMLDivElement, unknown>(tutorialData.id).node().getBoundingClientRect();
        class TutorialContentData {
            top: string;
            left: string;
            width: string;
            height: string;
            constructor(top: string, left: string, width: string, height: string) {
                this.top = top;
                this.left = left;
                this.width = width;
                this.height = height;
            }
        }
        window.scroll(0, tutorialFocus.top - 200);
        let data = [new TutorialContentData("0px", "0px", "100%", tutorialFocus.top + "px"), 
            new TutorialContentData(tutorialFocus.bottom + "px", "0px", "100%", "100%"), 
            new TutorialContentData(tutorialFocus.top + "px", "0px", tutorialFocus.left + "px", tutorialFocus.height + "px"), 
            new TutorialContentData(tutorialFocus.top + "px", tutorialFocus.right + "px", "100%", tutorialFocus.height + "px")]
        this.tutorial.selectAll(".tutorial-backdrop")
            .data(data)
            .join(
                enter => enter.append("div")
                    .attr("class", "tutorial-backdrop")
                    .style("top", d => d.top )
                    .style("left", d => d.left)
                    .style("width", d => d.width)
                    .style("height", d => d.height),
                update => update.style("top", d => d.top )
                    .style("left", d => d.left)
                    .style("width", d => d.width)
                    .style("height", d => d.height),
                exit => exit.remove()
            );
        
        this.appendTutorialContent(tutorialFocus, tutorialData.content);
    };
    private appendTutorialContent(tutorialFocus: DOMRect, content: string) {
        let isLeft = true;
        if (tutorialFocus.left + 50 > window.innerWidth / 2) {
            isLeft = false;
        }
        if (this.tutorial.selectAll(".tutorial-content").empty()) {
            this.tutorial.append("div")
                .attr("class", "tutorial-content")
                .style("top", (tutorialFocus.top - 50) + "px")
                .style("left", tutorialFocus.left + tutorialFocus.width + 50 + "px")
                .call(div => div.append("div")
                    .attr("class", "row")
                    .call(div => div.append("div")
                        .attr("class", "col-md-12")
                        .html(content))
                    .call(div => div.append("div")
                        .attr("class", "col-md-6"))
                    .call(div => div.append("div")
                        .attr("class", "col-md-5 d-flex")
                        .call(div => div.append("button")
                            .attr("class", "btn btn-success d-block w-50")
                            .html("Next")
                            .on("click", () => { this.slide = this.slide + 1; this.appendTutorialBackdrop() }))
                        .call(div => div.append("button")
                            .attr("class", "btn btn-warning d-block w-50")
                            .html("Skip")
                            .on("click", () => this.removeTutorial()))));
            this.drawArrow(tutorialFocus, isLeft);
        } else {
            this.tutorial.select<HTMLDivElement>(".tutorial-content")
                .style("top", (tutorialFocus.top - 50) + "px")
                .style("left", isLeft ? tutorialFocus.left + tutorialFocus.width + 50 + "px" : 
                    tutorialFocus.left - this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().width - 50 + "px");
            this.tutorial.select(".col-md-12")
                .html(content);
            this.tutorial.select(".tutorial-arrow").remove();
            this.drawArrow(tutorialFocus, isLeft);
        }
    };
    private drawArrow(tutorialFocus: DOMRect, isLeft: boolean): void {
        let tutorialArrow = this.tutorial.append("div")
            .attr("class", "tutorial-arrow")
            .style("top", (tutorialFocus.top - 50) + "px")
            .style("left", isLeft ? tutorialFocus.left + (tutorialFocus.width / 4) + "px" :
                this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().left + this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().width + "px")
            .style("width", (tutorialFocus.width / 4 * 3) + 50 + "px")
            .style("height", "50px");
        let svg = tutorialArrow.append("svg")
            .attr("viewBox", `0 0 ${tutorialArrow.node().getBoundingClientRect().width} ${tutorialArrow.node().getBoundingClientRect().height}`)
        svg.append("defs")
            .append("marker")
            .attr("id", "arrow-head")
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("refX", 2)
            .attr("refY", 2)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L0,4 L4,2 L0,0")
            .attr("class", "arrow-head");
        let xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, tutorialArrow.node().getBoundingClientRect().width]);
        let yScale = d3.scaleLinear()
            .domain([100, 0])
            .range([0, tutorialArrow.node().getBoundingClientRect().height]);
        let pathGenerator = d3.line<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveCatmullRom);
        svg.append("path")
            .attr("d", isLeft ? pathGenerator([{x: 95, y: 80}, {x: 25, y: 70}, {x: 25, y:25}]) : pathGenerator([{x: 0, y: 80}, {x: 75, y: 70}, {x: 75, y: 25}]))
            .attr("class", "arrow")
            .attr("marker-end", "url(#arrow-head)");
        
    };
    removeTutorial(): void {
        d3.select("body")
            .classed("no-overflow", false);
        this.tutorial.remove();
    };
}

/* ------------------------------------------------
    End of admin experimental interfaces and classes
-------------------------------------------------- */

export async function buildControlAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]) {
    let loading = new Loading();
    let rawData = entriesRaw.map(d => new AnalyticsChartsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    let colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map(d => new AnalyticsChartsData(d.group, d.value, d.creteDate, colourScale(d.group), d.selected));
    await drawCharts(entries);
    new Tutorial([ new TutorialData("#groups", "All your groups are selected to visualise and colours assigned. You cannot change this section"),
    new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#groups-chart .bar", "Hover for information on demand"), 
    new TutorialData("#group-histogram-chart .histogram-rect", "Hover for information on demand"),
    new TutorialData("#timeline-plot", "Swap chart types. Both charts have zoom available")]);
    loading.isLoading = false;
    loading.removeDiv();
    async function drawCharts(allEntries: IAnalyticsChartsData[]) {
        let adminControlCharts = new AdminControlCharts();
        //Handle sidebar button
        adminControlCharts.sidebarBtn();
        adminControlCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = allEntries.map(d => new AnalyticsChartsDataStats(d));

        //Create groups chart with current data
        let groupChart = new ChartSeries("groups-chart", data.map(d => d.group));
        adminControlCharts.renderGroupChart(groupChart, data);
        d3.select("#groups-chart .card-subtitle")
            .html("");

        //Handle groups chart help
        d3.select("#groups-chart .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), `${groupChart.id}-help`, "<b>Box plot</b><br>A box plot is used to show the data distribution<br><i>Q3:</i> The median of the upper half of the data set<br><i>Median:</i> The middle value of a dataset<br><i>Q1:</i> The median of the lower half of the dataset");
                adminControlCharts.help.helpPopover(groupChart.elements.contentContainer.select(".bar"), `${groupChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

        //Draw groups histogram container  
        let histogramChart = new HistogramChartSeries("group-histogram-chart", data.map(d => d.group));
        adminControlCharts.renderHistogram(histogramChart, data);

        //Handle histogram chart help
        d3.select("#group-histogram-chart .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), `${histogramChart.id}-help`, "<b>Histogram</b><br>A histogram group data points into user-specific ranges. The data points in this histogram are <i>reflections</i>");
                adminControlCharts.help.helpPopover(histogramChart.elements.contentContainer.select(".histogram-rect"), `${histogramChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

        //Draw timeline 
        let timelineChart = new ChartTime("group-timeline", [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        let timelineZoomChart = new ChartTimeZoom(timelineChart, [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        adminControlCharts.renderTimelineScatter(timelineChart, timelineZoomChart, data);
        adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, data);

        //Handle timeline chart help
        d3.select("#group-timeline .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), `${timelineChart.id}-help`, "<b>Density plot</b><br>A density plot shows the distribution of a numeric variable<br><b>Scatter plot</b><br>The data is showed as a collection of points<br>The data represented are <i>reflections over time</i>");
                adminControlCharts.help.helpPopover(d3.select("#group-timeline #timeline-plot"), `${timelineChart.id}-help-button`, "<u><i>click</i></u> me to change chart type");
                adminControlCharts.help.helpPopover(d3.select("#group-timeline .zoom-rect.active"), `${timelineChart.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                if (!timelineChart.elements.contentContainer.select(".circle").empty()) {
                    let showDataHelp = adminControlCharts.help.helpPopover(timelineChart.elements.contentContainer.select(".circle"), `${timelineChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
                    if (showDataHelp) {
                        d3.select(`#${timelineChart.id}-help-data`).style("top", parseInt(d3.select(`#${timelineChart.id}-help-data`).style("top")) - 14 + "px");
                    }
                }
            });
        
        //Draw users histogram container
        let usersData = data.map(d => d.getUsersData());
        let histogramUsersChart = new HistogramChartSeries("group-histogram-users-chart", data.map(d => d.group));
        adminControlCharts.renderHistogram(histogramUsersChart, usersData);

        //Handle users histogram chart help
        d3.select("#group-histogram-user-chart .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), `${histogramUsersChart.id}-help`, "<b>Histogram</b><br>A histogram group data points into user-specific ranges. The data points in this histogram are <i>users average reflection point</i>");
                adminControlCharts.help.helpPopover(histogramUsersChart.elements.contentContainer.select(`#${histogramUsersChart.id}-data`), `${histogramUsersChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

        //Draw user statistics
        let userStatistics = d3.select("#user-statistics .card-body");
        userStatistics.append("ul")
            .attr("class", "nav nav-tabs")
            .selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", (d, i) => `nav-link ${i == 0 ? "active" : ""}`)
            .attr("href", d => `#user-statistics-${d.group}`)
            .attr("data-toggle", "tab")
            .html(d => d.group)
            .on("click", (e, d) => setTimeout(() => adminControlCharts.renderUserStatistics(d3.select(`#user-statistics-${d.group}`), d, [30, 70]), 250));
        let users = userStatistics.append("div")
            .attr("class", "tab-content")          
            .selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", (d, i) => `tab-pane fade ${i == 0 ? "show active" : ""} users-tab-pane`)
            .attr("id", d => `user-statistics-${d.group}`);
        users.each((d, i, g) => i == 0 ? adminControlCharts.renderUserStatistics(d3.select(g[i]), d, [30, 70]) : "");

        //Handle users histogram chart help
        d3.select("#user-statistics .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), "user-statistics-help", "<b>Users ststistics</b><br>Each user's reflections are shown sorted by time. The chart depicts the average reflection point of the user against their group average");
            });
    }
}

export async function buildExperimentAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]) {
    let loading = new Loading();
    let rawData = entriesRaw.map(d => new AnalyticsChartsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    let colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map((d, i) => new AnalyticsChartsData(d.group, d.value, d.creteDate, colourScale(d.group), i == 0 ? true : false));
    await drawCharts(entries);
    new Tutorial([new TutorialData("#groups", "Add groups to the charts and change their colours"),
    new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#groups-chart .bar", "Hover for information on demand or click to compare and drill-down. Other charts will show only the selected group"), 
    new TutorialData("#group-histogram-chart .threshold-line", "Drag to change the threshold (soaring or distressed) and recalculate the bins"), 
    new TutorialData("#group-histogram-chart .histogram-rect", "Click to compare the bin with other's group bins"),
    new TutorialData("#timeline-plot", "Swap chart types. Both charts have zoom available. In the scatter plot, click a bubble to access the user's information")]);
    loading.isLoading = false;
    loading.removeDiv();
    async function drawCharts(allEntries: IAnalyticsChartsData[]) {
        let adminExperimentalCharts = new AdminExperimentalCharts();
        //Handle sidebar button
        adminExperimentalCharts.sidebarBtn();

        //Preloaded groups
        let entries = adminExperimentalCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = entries.map(d => new AnalyticsChartsDataStats(d));

        //Append groups chart container
        let groupCard = d3.select("#groups-chart .card-body");
        groupCard.insert("div", ".chart-container")
            .attr("class", "row")
            .call(div => div.append("span")
                .attr("class", "mx-2")
                .html("<small>Sort groups by:</small>"))
            .call(div => div.append("div")
                .attr("id", "sort-by")
                .attr("class", "btn-group btn-group-sm btn-group-toggle")
                .attr("data-toggle", "buttons")
                .html(`<label class="btn btn-light active">
                            <input type="radio" name="sort" value="date" checked>Create date<br>
                        </label>
                        <label class="btn btn-light">
                            <input type="radio" name="sort" value="name">Name<br>
                        </label>
                        <label class="btn btn-light">
                            <input type="radio" name="sort" value="mean">Mean<br>
                        </label>`));

        //Create group chart with current data
        adminExperimentalCharts.boxPlot = new ChartSeries("groups-chart", data.map(d => d.group));
        adminExperimentalCharts.boxPlot = adminExperimentalCharts.renderGroupChart(adminExperimentalCharts.boxPlot, data);

         //Handle groups chart help
         d3.select("#groups-chart .card-title button")
         .on("click", function (e: Event) {
            adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.boxPlot.id}-help`, "<b>Box plot</b><br>A box plot is used to show the data distribution<br><i>Q3:</i> The median of the upper half of the data set<br><i>Median:</i> The middle value of a dataset<br><i>Q1:</i> The median of the lower half of the dataset");
            adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.boxPlot.elements.contentContainer.select(`#${adminExperimentalCharts.boxPlot.id}-data`), `${adminExperimentalCharts.boxPlot.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to compare and drill-down");
            adminExperimentalCharts.help.helpPopover(d3.select("#groups-chart #sort-by"), `${adminExperimentalCharts.boxPlot.id}-help-button`, "<u><i>click</i></u> me to sort the groups");
         });

        //Draw groups histogram container  
        adminExperimentalCharts.histogram = new HistogramChartSeries("group-histogram-chart", data.map(d => d.group));
        adminExperimentalCharts.renderHistogram(adminExperimentalCharts.histogram, data);

        //Handle histogram chart help
        d3.select("#group-histogram-chart .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.histogram.id}-help`, "<b>Histogram</b><br>A histogram group data points into user-specific ranges. The data points in this histogram are <i>reflections point</i>");
                adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.histogram.elements.contentContainer.select(".histogram-rect"), `${adminExperimentalCharts.histogram.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to compare");
                let showDragHelp = adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.histogram.elements.contentContainer.select(".threshold-line.soaring"), `${adminExperimentalCharts.histogram.id}-help-drag`, "<u><i>drag</i></u> me to change the thresholds");
                if (showDragHelp) {
                    d3.select(`#${adminExperimentalCharts.histogram.id}-help-drag`).style("top", parseInt(d3.select(`#${adminExperimentalCharts.histogram.id}-help-drag`).style("top")) - 19 + "px");
                }
            });

        //Draw timeline 
        adminExperimentalCharts.timeline = new ChartTime("group-timeline", [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        adminExperimentalCharts.timelineZoom = new ChartTimeZoom(adminExperimentalCharts.timeline, [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        adminExperimentalCharts.renderTimelineScatter(adminExperimentalCharts.timeline, adminExperimentalCharts.timelineZoom, data);
        adminExperimentalCharts.handleTimelineButtons(adminExperimentalCharts.timeline, adminExperimentalCharts.timelineZoom, data);

        //Handle timeline chart help
        d3.select("#group-timeline .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select("#group-timeline #timeline-plot"), `${adminExperimentalCharts.timeline.id}-help-button`, "<u><i>click</i></u> me to change chart type");
                adminExperimentalCharts.help.helpPopover(d3.select("#group-timeline .zoom-rect.active"), `${adminExperimentalCharts.timeline.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                if (!adminExperimentalCharts.timeline.elements.contentContainer.select(".circle").empty()) {
                    adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.timeline.id}-help`, "<b>Scatter plot</b><br>A scatter plot shows the data as a collection of points<br>The data represented are <i>reflections over time</i>");
                    let showDataHelp = adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.timeline.elements.contentContainer.select(".circle"), `${adminExperimentalCharts.timeline.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to connect the user's reflections");
                    if (showDataHelp) {
                        d3.select(`#${adminExperimentalCharts.timeline.id}-help-data`).style("top", parseInt(d3.select(`#${adminExperimentalCharts.timeline.id}-help-data`).style("top")) - 14 + "px");
                    }
                } else {
                    adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.timeline.id}-help`, "<b>Density plot</b><br>A density plot shows the distribution of a numeric variable<br>The data represented are <i>reflections over time</i>");
                }
            });

        //Draw users histogram container
        let usersData = data.map(d => d.getUsersData());
        adminExperimentalCharts.usersHistogram = new HistogramChartSeries("group-histogram-users-chart", data.map(d => d.group));
        adminExperimentalCharts.renderHistogram(adminExperimentalCharts.usersHistogram, usersData);

        //Handle users histogram chart help
        d3.select("#group-histogram-users-chart .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.usersHistogram.id}-help`, "<b>Histogram</b><br>A histogram group data points into user-specific ranges. The data points in this histogram are <i>users average reflection point</i>");
                adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.usersHistogram.elements.contentContainer.select(".histogram-rect"), `${adminExperimentalCharts.usersHistogram.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to compare");
                let showDragHelp = adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.usersHistogram.elements.contentContainer.select(".threshold-line.soaring"), `${adminExperimentalCharts.usersHistogram.id}-help-drag`, "<u><i>drag</i></u> me to change the thresholds");
                if (showDragHelp) {
                    d3.select(`#${adminExperimentalCharts.usersHistogram.id}-help-drag`).style("top", parseInt(d3.select(`#${adminExperimentalCharts.usersHistogram.id}-help-drag`).style("top")) - 19 + "px");
                }
            });

        //Draw user statistics
        let userStatistics = d3.select("#user-statistics .card");
        userStatistics.select(".chart-container").remove();
        userStatistics.select(".card-subtitle")
            .html("Select a reflection from the scatter plot to view specific users");
        
        //Handle users histogram chart help
        d3.select("#user-statistics .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select(this), "user-statistics-help", "<b>Users ststistics</b><br>The selected user's reflections are shown sorted by time. The chart depicts the average reflection point of the user against their group average");
            });

        //Update charts depending on group
        adminExperimentalCharts.handleGroups();
        adminExperimentalCharts.handleGroupsColours();
        adminExperimentalCharts.handleGroupsSort();
    }
}