import * as d3 from "d3";

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
    transformData(data: IAnalyticsChartsDataRaw): AnalyticsChartsData;
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
    transformData(data: IAnalyticsChartsDataRaw): AnalyticsChartsData {
        return new AnalyticsChartsData(data.group, data.value.map(d => {
            return {
            timestamp: new Date(d.timestamp), pseudonym: d.pseudonym, point: parseInt(d.point), text: d.text
            }
        }) as IReflectionAuthorEntry[], new Date(data.createDate), undefined, false);
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
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData;
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
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData {
        let usersMean = Array.from(d3.rollup(data.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
        return new AnalyticsChartsData(data.group, usersMean, data.creteDate, data.colour);
    }
}

interface IAnalyticsChartsDataStats extends IAnalyticsChartsData {
    mean: number;
    median: number;
    q1: number;
    q3: number;
    max: number;
    min: number;
    variance: string;
    deviation: string;
    oldestReflection: Date;
    newestReflection: Date;
    avgReflectionsPerUser: string;
    userMostReflective: number;
    userLessReflective: number;
    totalUsers: number;
    roundDecimal(value: number): string;
}

class AnalyticsChartsDataStats extends AnalyticsChartsData implements IAnalyticsChartsDataStats {
    group: string;
    value: IReflectionAuthorEntry[];
    selected: boolean;
    mean: number;
    median: number;
    q1: number;
    q3: number;
    max: number;
    min: number;
    variance: string;
    deviation: string;
    oldestReflection: Date;
    newestReflection: Date;
    avgReflectionsPerUser: string;
    userMostReflective: number;
    userLessReflective: number;
    totalUsers: number;
    constructor(entries: IAnalyticsChartsData) {
        super(entries.group, entries.value, entries.creteDate, entries.colour, entries.selected);
        let uniqueUsers = Array.from(d3.rollup(entries.value, (d: IReflectionAuthorEntry[]) => d.length, (d: IReflectionAuthorEntry) => d.pseudonym), ([key, value]) => ({ key, value }));
        this.mean = Math.round(d3.mean(entries.value.map(r => r.point))),
            this.median = d3.median(entries.value.map(r => r.point)),
            this.q1 = d3.quantile(entries.value.map(r => r.point), 0.25),
            this.q3 = d3.quantile(entries.value.map(r => r.point), 0.75),
            this.max = d3.max(entries.value.map(r => r.point)),
            this.min = d3.min(entries.value.map(r => r.point)),
            this.variance = this.roundDecimal(d3.variance(entries.value.map(r => r.point))),
            this.deviation = this.roundDecimal(d3.deviation(entries.value.map(r => r.point))),
            this.oldestReflection = d3.min(entries.value.map(r => new Date(r.timestamp))),
            this.newestReflection = d3.max(entries.value.map(r => new Date(r.timestamp))),
            this.avgReflectionsPerUser = this.roundDecimal(d3.mean(uniqueUsers.map(r => r.value))),
            this.userMostReflective = d3.max(uniqueUsers.map(r => r.value)),
            this.userLessReflective = d3.min(uniqueUsers.map(r => r.value)),
            this.totalUsers = uniqueUsers.length
    };
    roundDecimal(value: number): string {
        let p = d3.precisionFixed(0.1);
        let f = d3.format("." + p + "f");
        return f(value);
    }
}

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
    elements: IChartElements | IViolinChartElements;
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
        let containerDimensions = d3.select(`#${id} .chart-container`).node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding();
        this.y = new ChartLinearAxis("State", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        this.elements = new ChartElements();
        this.click = false;
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
        let containerDimensions = d3.select(`#${id} .chart-container`).node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(75, 75, 5);
        this.htmlContainers = new HtmlContainers();
        this.y = new ChartLinearAxis("State", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartTimeAxis("Time", domain, [0, this.width - this.padding.yAxis]);
        this.elements = new ChartElements();
        this.click = false;
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

// Interface for violin chart series
interface IViolinChartSeries extends IChart {
    elements: IViolinChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
}

// Class for violin chart series
class ViolinChartSeries extends ChartSeries implements IViolinChartSeries {
    elements: IViolinChartElements;
    thresholdAxis: d3.Axis<d3.NumberValue>;
    constructor(id: string, domain: string[]) {
        super(id, domain);
        this.elements = new ViolinChartElements();
        this.padding = new ChartPadding(50, 75, 25, 85);
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        this.thresholdAxis = this.y.setThresholdAxis(30, 70);
    }
}

// Basic interface for chart axis scales
interface IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    sorted: boolean;
}

// Basic class for series axis scale
class ChartSeriesAxis implements IChartAxis {
    scale: d3.ScaleBand<string>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    sorted: boolean;
    constructor(label: string, domain: string[], range: number[]) {
        this.label = label;
        this.scale = d3.scaleBand()
            .domain(domain)
            .rangeRound(range)
            .padding(0.25);
        this.axis = d3.axisBottom(this.scale);
        this.sorted = false;
    };
}

// Basic class for linear axis scale
class ChartLinearAxis implements IChartAxis {
    scale: d3.ScaleLinear<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    sorted: boolean;
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
            .tickFormat((d: d3.AxisDomain, i: number) => labels.get(d));
        this.sorted = false;
    };
    setThresholdAxis(tDistressed: number, tSoaring: number) {
        return d3.axisRight(this.scale)
            .tickValues([tDistressed, tSoaring])
            .tickFormat((d: number) => d == tDistressed ? "Distressed" : d == tSoaring ? "Soaring" : "");
    }
}

// Basic class for time axis scale
class ChartTimeAxis implements IChartAxis {
    scale: d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    sorted: boolean;
    constructor(label: string, domain: Date[], range: number[]) {
        this.label = label;
        this.scale = d3.scaleTime()
            .domain(domain)
            .range(range);
        this.axis = d3.axisBottom(this.scale)
        this.sorted = false;
    };
}

// Basic interface for chart elements (includes zoom)
interface IChartElements {
    svg: any;
    contentContainer: any;
    content: any;
    xAxis: any;
    yAxis: any;
    zoomSVG: any;
    zoomFocus: any;
    preRender(chart: IChart): void;
    appendSVG(chart: IChart): any;
    appendContentContainer(chart: IChart): any;
    appendXAxis(chart: IChart): any;
    appendXAxisLabel(chart: IChart): any;
    appendYAxis(chart: IChart): any;
    appendYAxisLabel(chart: IChart): any;
}

// Basic class for chart elements (includes zoom)
class ChartElements implements IChartElements {
    svg: any;
    contentContainer: any;
    content: any;
    xAxis: any;
    yAxis: any;
    zoomSVG: any;
    zoomFocus: any;
    preRender(chart: IChart): void {
        chart.elements.svg = this.appendSVG(chart);
        chart.elements.contentContainer = this.appendContentContainer(chart);
        chart.elements.xAxis = this.appendXAxis(chart);
        this.appendXAxisLabel(chart);
        this.appendYAxis(chart);
        this.appendYAxisLabel(chart);
    }
    appendSVG(chart: IChart) {
        return d3.select(`#${chart.id}`)
            .select(".chart-container")
            .append("svg")
            .attr("id", `chart-${chart.id}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${chart.width} ${chart.height}`);
    };
    appendContentContainer(chart: IChart) {
        let result = chart.elements.svg.append("g")
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
        return chart.elements.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - chart.padding.xAxis})`)
            .attr("class", "x-axis")
            .attr("clip-path", `url(#clip-${chart.id})`)
            .call(chart.x.axis);
    };
    appendXAxisLabel(chart: IChart) {
        return chart.elements.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (chart.elements.svg.select(".x-axis").node().getBBox().width / 2 + chart.padding.yAxis) + ", " + (chart.height - chart.padding.xAxis + chart.elements.svg.select(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(chart.x.label);
    };
    appendYAxis(chart: IChart) {
        return chart.elements.svg.append("g")
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.padding.top})`)
            .attr("class", "y-axis")
            .call(chart.y.axis);
    };
    appendYAxisLabel(chart: IChart) {
        return chart.elements.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (chart.padding.yAxis - chart.elements.svg.select(".y-axis").node().getBBox().width) + ", " + (chart.padding.top + chart.elements.svg.select(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(chart.y.label);
    }
}

// Interface for violin charts
interface IViolinChartElements extends IChartElements {
    renderViolinThresholds(chart: ViolinChartSeries, threshold: number[]): void
    appendThresholdAxis(chart: ViolinChartSeries): any;
    appendThresholdLabel(chart: ViolinChartSeries): any;
    appendThresholdIndicators(chart: ViolinChartSeries, thresholds: number[]): void;
    appendThresholdLine(chart: ViolinChartSeries, thresholds: number[]): void;
    appendThresholdPercentages(chart: ViolinChartSeries, bin: any, bandwithScale: any, tDistressed: number, tSoaring: number): void;
    getThresholdsValues(chart: ViolinChartSeries): number[];
}

// Class for violin charts
class ViolinChartElements extends ChartElements implements IViolinChartElements {
    renderViolinThresholds(chart: ViolinChartSeries, threshold: number[]): void {
        this.appendThresholdAxis(chart);
        this.appendThresholdIndicators(chart, threshold);
        this.appendThresholdLabel(chart);
        this.appendThresholdLine(chart, threshold);
    };
    appendThresholdAxis(chart: ViolinChartSeries) {
        return chart.elements.contentContainer.append("g")
            .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right}, 0)`)
            .attr("class", "threshold-axis")
            .call(chart.thresholdAxis);
    };
    appendThresholdLabel(chart: ViolinChartSeries) {
        let label = chart.elements.svg.append("g")
            .attr("class", "threshold-label-container")
        label.append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text("Thresholds");
        label.attr("transform", `translate(${chart.width - chart.padding.right + chart.elements.contentContainer.select(".threshold-axis").node().getBBox().width + label.node().getBBox().height}, ${chart.padding.top + chart.elements.svg.select(".y-axis").node().getBBox().height / 2}) rotate(-90)`);
        return label;
    };
    appendThresholdIndicators(chart: ViolinChartSeries, thresholds: number[]): void {
        thresholds.forEach((c, i) => {
            let indicator = chart.elements.contentContainer.append("g")
                .attr("class", `threshold-indicator-container ${i == 0 ? "distressed" : "soaring"}`)
                .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${chart.y.scale(c) + 25})`);
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
    };
    appendThresholdLine(chart: ViolinChartSeries, thresholds: number[]): void {
        thresholds.forEach((c, i) => {
            chart.elements.contentContainer.append("line")
                .attr("class", `threshold-line ${i == 0 ? "distressed" : "soaring"}`)
                .attr("x1", 0)
                .attr("x2", chart.width - chart.padding.yAxis - chart.padding.right)
                .attr("y1", chart.y.scale(c))
                .attr("y2", chart.y.scale(c));
        });
    };
    appendThresholdPercentages(chart: ViolinChartSeries, bin: d3.HistogramGeneratorNumber<number, number>, bandwithScale: any, tDistressed: number, tSoaring: number): void {
        let binData = function (data: IReflectionAuthorEntry[]) {
            let bins = bin(data.map(r => r.point));
            let result = [] as IBinData[]
            bins.forEach((c: number[]) => {
                result.push({ bin: c, percentage: c.length / data.length * 100 });
            })
            return result;
        };
        let binContainer = chart.elements.contentContainer.selectAll(`.${chart.id}-violin-container`);
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
            .attr("x", bandwithScale(0) - binText.node().getBBox().width / 2);
        function positionY(i: number) {
            return chart.y.scale(i == 0 ? tDistressed / 2 : i == 1 ? 50 : (100 - tSoaring) / 2 + tSoaring) - binTextBox.node().getBBox().height / 2;
        }
    };
    getThresholdsValues(chart: ViolinChartSeries): number[] {
        let result: number[] = [30, 70];
        let dThreshold = chart.elements.contentContainer.select(".threshold-line.distressed");
        if (dThreshold != undefined) {
            result[0] = chart.y.scale.invert(dThreshold.attr("y1"));
        }
        let sThreshold = chart.elements.contentContainer.select(".threshold-line.soaring");
        if (sThreshold != undefined) {
            result[1] = chart.y.scale.invert(sThreshold.attr("y1"));
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

// Basin class for chart paddinf
class ChartPadding implements IChartPadding {
    xAxis: number;
    yAxis: number;
    top: number;
    right: number;
    constructor(xAxis?: number, yAxis?: number, top?: number, right?: number) {
        this.xAxis = xAxis == undefined ? 50 : xAxis;
        this.yAxis = yAxis == undefined ? 75 : yAxis;
        this.top = top == undefined ? 25 : top;
        this.right = right == undefined ? 0 : right;
    }
}

interface IBinData {
    bin: number[],
    percentage: number
}

// Basic interface for Html containers
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

// Basic class for Html containers
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
        if (this.groupStatistics != undefined) {
            this.groupStatistics.remove();
        }
        if (this.groupTimeline != undefined) {
            this.groupTimeline.remove();
        }
        if (this.groupViolin != undefined) {
            this.groupViolin.remove();
        }
        if (this.userViolin != undefined) {
            this.userViolin.remove();
        }
        if (this.compare != undefined) {
            this.compare.remove();
        }
        this.removeUsers();
    };
    removeUsers() {
        if (this.userStatistics != undefined) {
            this.userStatistics.remove();
        }
        if (this.reflections != undefined) {
            this.reflections.remove();
        }
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

// Basic interface for tooltip content interaction
interface ITooltipValues {
    label: string;
    value: number;
}

// Basic class for tooltip content interaction
class TooltipValues implements ITooltipValues {
    label: string;
    value: number;
    constructor(label?: string, value?: number) {
        this.label = label == undefined ? "" : label;
        this.value = value == undefined ? 0 : value;
    }
}

// Interface for tooltip interaction
interface ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void;
    removeTooltip(chart: IChart): void
    appendTooltipContainer(chart: IChart): void;
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[]): void;
    positionTooltipContainer(chart: IChart, x: number, y: number): void;
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number, colour: string): void;
}

// Class for tooltip interaction
class Tooltip implements ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void {
        this.appendTooltipContainer(chart);
        chart.elements.content.on("mouseover", onMouseover)
            .on("mouseout", onMouseout);
    };
    removeTooltip(chart: IChart): void {
        chart.elements.contentContainer.selectAll(".tooltip-box").remove();
        chart.elements.contentContainer.selectAll(".tooltip-text").remove();
        chart.elements.contentContainer.selectAll(".tooltip-line").remove();
    };
    appendTooltipContainer(chart: IChart): void {
        chart.elements.contentContainer.selectAll(".tooltip-container").remove();
        return chart.elements.contentContainer.append("g")
            .attr("class", "tooltip-container");
    };
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[] = null): void {
        let result = chart.elements.contentContainer.select(".tooltip-container").append("rect")
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
        chart.elements.contentContainer.select(".tooltip-box").attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5);
        return result;
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
    appendZoomBar(chart: ChartTime): any;
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
    appendZoomBar(chart: ChartTime): any {
        return chart.elements.svg.append("g")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - 30})`);
    };
}

// Interface for click interaction
interface IClick {
    enableClick(chart: IChart, onClick: any): void;
    removeClick(chart: IChart): void;
    removeClickClass(chart: IChart, css: string): void;
    appendScatterText(chart: IChart, d: IReflectionAuthorEntry, title: string, values: ITooltipValues[]): void;
    positionClickContainer(chart: ChartTime, box: any, text: any, d: IReflectionAuthorEntry): string;
    appendGroupsText(chart: ChartSeries, data: IAnalyticsChartsDataStats[], clickData: IAnalyticsChartsDataStats): void;
    comparativeText(clickValue: number, value: number, clickXValue: string | Date, xValue: string | Date): string[];
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
    };
    removeClickClass(chart: IChart, css: string): void {
        d3.selectAll(`#${chart.id} .content-container .${css}`)
            .attr("class", css)
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
        chart.elements.contentContainer.selectAll(".click-container text").remove();

        chart.elements.content.attr("class", (d: IAnalyticsChartsDataStats) => d.group == clickData.group ? "bar clicked" : "bar");

        let clickContainer = chart.elements.contentContainer.selectAll(".click-container")
            .data(data);
        clickContainer.enter()
            .append("g")
            .merge(clickContainer)
            .attr("class", "click-container")
            .attr("transform", (c: IAnalyticsChartsDataStats) => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`);
        clickContainer.exit().remove();

        chart.elements.contentContainer.selectAll(".click-container").append("text")
            .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[0])
            .attr("y", (c: IAnalyticsChartsDataStats) => chart.y.scale(c.q3) - 5)
            .text((c: IAnalyticsChartsDataStats) => `q3: ${this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[1]}`);
        chart.elements.contentContainer.selectAll(".click-container").append("text")
            .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.median, c.median, clickData.group, c.group)[0])
            .attr("y", (c: IAnalyticsChartsDataStats) => chart.y.scale(c.median) - 5)
            .text((c: IAnalyticsChartsDataStats) => `Median: ${this.comparativeText(clickData.median, c.median, clickData.group, c.group)[1]}`);
        chart.elements.contentContainer.selectAll(".click-container").append("text")
            .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[0])
            .attr("y", (c: IAnalyticsChartsDataStats) => chart.y.scale(c.q1) - 5)
            .text((c: IAnalyticsChartsDataStats) => `q1: ${this.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[1]}`);
    };
    comparativeText(clickValue: number, value: number, clickXValue: string | Date, xValue: string | Date): string[] {
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
}

// Interface for sort interaction
interface ISort {
    appendArrow(chart: IChart, x: boolean, y: boolean): d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    arrowPoints(chart: IChart, x: boolean, y: boolean): string;
    setSorted(chart: IChart, x: boolean, y: boolean): boolean;
    arrowTransition(chart: IChart, x: boolean, y: boolean): void;
    sortData(a: number, b: number, sorted: boolean): number;
}

// Class for sort interaction
class Sort implements ISort {
    appendArrow(chart: IChart, x: boolean = false, y: boolean = false): d3.Selection<d3.BaseType, unknown, HTMLElement, any> {
        let selector = x == true ? ".x-label-container" : ".y-label-container";
        let button = d3.select(selector).attr("class", "y-label-container sort");
        button.append("polygon")
            .attr("class", "sort-arrow")
            .attr("points", this.arrowPoints(chart, x, y));
        return button;
    };
    arrowPoints(chart: IChart, x: boolean, y: boolean): string {
        let selector = x == true ? ".x-label-text" : ".y-label-text";
        let height = chart.elements.svg.select(selector).node().getBBox().height;
        let width = chart.elements.svg.select(selector).node().getBBox().width;
        let point1 = [(width / 2) + 5, 0];
        let point2 = [(width / 2) + 5, -height / 2];
        let point3 = [(width / 2) + 15, -height / 4];

        if ((x == true && chart.x.sorted == false) || (y == true && chart.y.sorted == false)) {
            point1 = [-(width / 2) - 5, 0];
            point2 = [-(width / 2) - 5, -height / 2];
            point3 = [-(width / 2) - 15, -height / 4];
        }

        return point1 + ", " + point2 + ", " + point3;
    };
    setSorted(chart: IChart, x: boolean = false, y: boolean = false): boolean {
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
    };
    arrowTransition(chart: IChart, x: boolean = false, y: boolean = false): void {
        let selector = x == true ? ".x-label-container" : ".y-label-container";
        if(chart.elements.svg.select(`${selector} .sort-arrow.active`).empty()) {
            chart.elements.svg.select(`${selector} .sort-arrow`)
                .transition()
                .attr("points", this.arrowPoints(chart, x, y))
                .attr("class", "sort-arrow active");
        } else {
            chart.elements.svg.select(`${selector} .sort-arrow.active`)
                .attr("class", "sort-arrow")
                .transition()
                .attr("points", this.arrowPoints(chart, x, y))
                .attr("class", "sort-arrow active");
        }
    };
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
}

/* ------------------------------------------------
    Start of admin control interfaces and classes 
-------------------------------------------------- */
interface IAdminControlCharts {
    htmlContainers: IHtmlContainers;
    interactions: IAdminControlInteractions;
    sidebarBtn(): void;
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[];
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries;
    renderGroupStats(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsDataStats): any;
    renderViolin(chart: ViolinChartSeries, data: IAnalyticsChartsData[]): ViolinChartSeries;
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData): ChartTime;
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): ChartTime;
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): void;
    renderUserStatistics(card: any, data: IAnalyticsChartsData, pseudonym?: string): void;
}

class AdminControlCharts implements IAdminControlCharts {
    htmlContainers = new HtmlContainers();
    interactions = new AdminControlInteractions();
    sidebarBtn(): void {
        let sidebarWidth = d3.select("#sidebar").node().getBoundingClientRect().width;
        d3.select("#sidebar")
            .style("width", `${sidebarWidth}px`);
        d3.select("#content")
            .style("margin-left", `${sidebarWidth}px`);

        //Handle side bar btn click
        d3.select("#sidebar-btn").on("click", (e: any) => {
            let isActive = d3.select("#sidebar").attr("class") == "active";
            d3.select("#sidebar")
                .attr("class", isActive ? "" : "active")
                .style("margin-left", isActive ? `${66 - sidebarWidth}px` : "");
            d3.select("#sidebar #groups")
                .style("opacity", isActive ? "0" : "1");
            d3.select("#content")
                .style("margin-left", isActive ? "66px" : `${sidebarWidth}px` );
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
        //Select existing minMax lines
        let minMax = chart.elements.contentContainer.selectAll(`#${chart.id}-data-min-max`)
            .data(data)
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour);

        //Remove old minMax lines
        minMax.exit().remove();

        //Append new minMax lines
        let minMaxEnter = minMax.enter()
            .append("line")
            .attr("id", `${chart.id}-data-min-max`)
            .attr("class", "box-line")
            .attr("x1", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
            .attr("x2", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
            .attr("y1", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.min))
            .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.max))
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour);

        //Merge existing and new minMax lines
        minMax.merge(minMaxEnter);

        //Select existing median lines
        let median = chart.elements.contentContainer.selectAll(`#${chart.id}-data-median`)
            .data(data)
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour);

        //Remove old median lines
        median.exit().remove();

        //Append new median lines
        let medianEnter = median.enter()
            .append("line")
            .attr("id", `${chart.id}-data-median`)
            .attr("class", "box-line")
            .attr("x1", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group))
            .attr("x2", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group) + chart.x.scale.bandwidth())
            .attr("y1", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.median))
            .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.median))
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour);

        //Merge existing and new median lines
        median.merge(medianEnter);

        //Select existing boxes
        let boxes = chart.elements.contentContainer.selectAll(`#${chart.id}-data`)
            .data(data)
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour)
            .style("fill", (d: IAnalyticsChartsDataStats) => d.colour);

        //Remove old boxes
        boxes.exit().remove();

        //Append new boxes
        let boxesEnter = boxes.enter()
            .append("rect")
            .attr("id", `${chart.id}-data`)
            .classed("bar", true)
            .attr("y", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.q3))
            .attr("x", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group))
            .attr("width", (d: IAnalyticsChartsDataStats) => chart.x.scale.bandwidth())
            .attr("height", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.q1) - chart.y.scale(d.q3))
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour)
            .style("fill", (d: IAnalyticsChartsDataStats) => d.colour);

        //Merge existing and new boxes
        boxes.merge(boxesEnter);

        //Transition boxes and lines
        let _this = this;
        _this.interactions.bars(chart, data);

        //Set render elements content to boxes
        chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-data`);

        //Enable tooltip
        this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e: Event, d: IAnalyticsChartsDataStats): void {
            //If box is clicked not append tooltip
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }

            //Append tooltip box with text
            let tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.group,
                [new TooltipValues("q1", d.q1),
                new TooltipValues("q3", d.q3),
                new TooltipValues("Median", d.median),
                new TooltipValues("Mean", d.mean),
                new TooltipValues("Max", d.max),
                new TooltipValues("Min", d.min)]);

            //Position tooltip container
            _this.interactions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.q3, tooltipBox));
            function xTooltip(x: string, tooltipBox: any) {
                //Position tooltip right of the box
                let xTooltip = chart.x.scale(x) + chart.x.scale.bandwidth();

                //If tooltip does not fit position left of the box
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - chart.x.scale.bandwidth() - tooltipBox.node().getBBox().width;
                }

                return xTooltip
            }
            function yTooltip(y: number, tooltipBox: any) {
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
    renderGroupStats(div: any, data: IAnalyticsChartsDataStats): any {
        div.select(".card-body").html("");
        return div.select(".card-body")
            .attr("class", "card-body statistics-text")
            .html(`<b>Q1: </b>${data.q1}<br>
                        <b>Median: </b>${data.median}<br>
                        <b>Q3: </b>${data.q3}<br>
                        <b>Mean: </b>${data.mean}<br>
                        <b>Total Reflections: </b>${data.value.length}<br>
                        <b>Variance: </b>${data.variance}<br>
                        <b>Std Deviation: </b>${data.deviation}<br>
                        <b>Max: </b>${data.max}<br>
                        <b>Min: </b>${data.min}<br>
                        <b>Reflections per user: </b>${data.avgReflectionsPerUser}<br>
                        <b>Max reflections per user: </b>${data.userMostReflective}<br>
                        <b>Min reflections per user: </b>${data.userLessReflective}<br>
                        <b>Total Users: </b>${data.totalUsers}<br>
                        <b>Oldest reflection</b><br>${data.oldestReflection.toDateString()}<br>
                        <b>Newest reflection</b><br>${data.newestReflection.toDateString()}<br>`);
    };
    renderViolin(chart: ViolinChartSeries, data: IAnalyticsChartsData[]): ViolinChartSeries {
        let _this = this;
        let thresholds = chart.elements.getThresholdsValues(chart);
        let tDistressed = thresholds[0];
        let tSoaring = thresholds[1];
        //Create bandwidth scale
        let bandwithScale = d3.scaleLinear()
            .range([0, chart.x.scale.bandwidth()])
            .domain([-d3.max(data.map(r => r.value.length)), d3.max(data.map(r => r.value.length))]);

        //Create bins             
        let bin = d3.bin().domain([0, 100]).thresholds([0, tDistressed, tSoaring]);

        //Select existing bin containers
        let binContainer = chart.elements.contentContainer.selectAll(`.${chart.id}-violin-container`)
            .data(data);

        //Remove old bin containers
        binContainer.exit().remove();

        //Update colours
        binContainer.select("path")
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour)
            .style("fill", (d: IAnalyticsChartsDataStats) => d.colour);

        //Append new bin containers
        let binContainerEnter = binContainer.enter()
            .append("g")
            .attr("class", `${chart.id}-violin-container`)
            .attr("transform", (d: IAnalyticsChartsData) => `translate(${chart.x.scale(d.group)}, 0)`);

        //Draw violins
        binContainerEnter.append("path")
            .attr("id", `${chart.id}-violin`)            
            .attr("class", "violin-path")
            .style("stroke", (d: IAnalyticsChartsDataStats) => d.colour)
            .style("fill", (d: IAnalyticsChartsDataStats) => d.colour)
            .datum((d: IAnalyticsChartsData) => bin(d.value.map(d => d.point)))
            .attr("d", d3.area()
                .x0((d: number[]) => bandwithScale(-d.length))
                .x1((d: number[]) => bandwithScale(d.length))
                .y((d: number[], i: number) => chart.y.scale(i == 0 ? 0 : i == 1 ? 50 : 100))
                .curve(d3.curveCatmullRom));

        //Transision bin containers
        binContainer.transition()
            .duration(750)
            .attr("transform", (d: IAnalyticsChartsData) => `translate(${chart.x.scale(d.group)}, 0)`);

        //Merge existing with new bin containers
        binContainer.merge(binContainerEnter);

        //Transition violins
        this.interactions.violin(chart, data, tDistressed, tSoaring);

        //Append tooltip container
        this.interactions.tooltip.appendTooltipContainer(chart);
        chart.elements.contentContainer.selectAll(".violin-text")
            .on("mouseover", onMouseover)
            .on("mouseout", onMouseout);
        function onMouseover(e: Event, d: IBinData) {
            _this.interactions.tooltip.appendTooltipText(chart, `Count: ${d.bin.length.toString()}`);
            _this.interactions.tooltip.positionTooltipContainer(chart, bandwithScale(0), parseInt(d3.select(this).attr("y")) - d3.selectAll(".violin-text-box").node().getBBox().height);
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.interactions.tooltip.removeTooltip(chart);
        }
        return chart;
    };
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData): ChartTime {
        //Remove scatter plot
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`).remove();
        chart.elements.svg.selectAll(".zoom-container").remove();
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
        chart.elements.zoomSVG = undefined;
        chart.elements.zoomFocus = undefined;

        //Create density data
        function createDensityData() {
            return d3.contourDensity<IReflectionAuthorEntry>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point))
                .bandwidth(5)
                .thresholds(20)
                .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])
                (data.value);
        }

        //Draw contours
        chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`)
            .data(createDensityData())
            .enter()
            .append("path")
            .attr("id", `${chart.id}-timeline-contours`)
            .attr("class", "contour")
            .attr("d", d3.geoPath())
            .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateRgb("#ffffff", data.colour)(d.value * 25))
            .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateRgb("#ffffff", data.colour)(d.value * 20));

        //Enable zoom
        this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
            chart.x.scale.rangeRound(newChartRange);

            let newDensityData = createDensityData();

            let zoomContours = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`)
                .data(newDensityData);

            zoomContours.exit().remove();

            let zoomContoursEnter = zoomContours.enter()
                .append("path")
                .attr("id", `${chart.id}-timeline-contours`)
                .attr("class", "contour")
                .attr("d", d3.geoPath())
                .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateRgb("#ffffff", data.colour)(d.value * 25))
                .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateRgb("#ffffff", data.colour)(d.value * 20));

            zoomContours.attr("d", d3.geoPath())
                .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateRgb("#ffffff", data.colour)(d.value * 25))
                .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateRgb("#ffffff", data.colour)(d.value * 20));

            zoomContours.merge(zoomContoursEnter);

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
        }
        return chart;
    };
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): ChartTime {
        //Remove density plot
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`).remove();

        //Select existing circles
        let circles = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`)
            .data(data.value)
            .style("stroke", data.colour)
            .style("fill", data.colour);

        //Remove old circles
        circles.exit().remove();

        //Append new circles
        let circlesEnter = circles.enter()
            .append("circle")
            .classed("line-circle", true)
            .attr("id", `${chart.id}-timeline-circles`)
            .attr("r", 5)
            .attr("cx", (d: IReflectionAuthorEntry) => chart.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => chart.y.scale(d.point))
            .style("stroke", data.colour)
            .style("fill", data.colour);

        //Merge existing and new circles
        circles.merge(circlesEnter);

        let _this = this;
        _this.interactions.circles(chart, data);

        //Set render elements content to circles
        chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`);

        //Enable tooltip       
        _this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e: Event, d: IReflectionAuthorEntry) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            let tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.timestamp.toDateString(), [{ label: "State", value: d.point }]);
            _this.interactions.tooltip.positionTooltipContainer(chart, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));

            function xTooltip(x: Date, tooltipBox: any) {
                let xTooltip = chart.x.scale(x);
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - tooltipBox.node().getBBox().width;
                }
                return xTooltip
            };

            function yTooltip(y: number, tooltipBox: any) {
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

        //Select existing zoom circles
        let zoomCircle = chart.elements.zoomSVG.selectAll(`#${chart.id}-zoom-bar-content`)
            .data(data.value)
            .style("stroke", data.colour)
            .style("fill", data.colour);

        //Remove old zoom circles
        zoomCircle.exit().remove();

        //Append new zoom circles
        let zoomCircleEnter = zoomCircle.enter()
            .append("circle")
            .classed("zoom-circle", true)
            .attr("id", `${chart.id}-zoom-bar-content`)
            .attr("r", 2)
            .attr("cx", (d: IReflectionAuthorEntry) => zoomChart.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => zoomChart.y.scale(d.point))
            .style("stroke", data.colour)
            .style("fill", data.colour);

        //Merge existing and new zoom circles
        zoomCircle.merge(zoomCircleEnter);
        _this.interactions.circlesZoom(chart, zoomChart, data);

        let zoomCircleContent = chart.elements.zoomFocus.selectAll(`#${chart.id}-zoom-content`)
            .data(data.value);
        zoomCircleContent.exit().remove();
        let zoomCircleContentEnter = zoomCircleContent.enter()
            .append("circle")
            .classed("zoom-content", true)
            .attr("id", `${chart.id}-zoom-content`)
            .attr("r", 2)
            .attr("cx", (d: IReflectionAuthorEntry) => zoomChart.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => zoomChart.y.scale(d.point));
        zoomCircleContent.merge(zoomCircleContentEnter);

        //Enable zoom
        _this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e: any) {
            let newChartRange = [0, chart.width - chart.padding.yAxis].map(d => e.transform.applyX(d));
            chart.x.scale.rangeRound(newChartRange);
            zoomChart.x.scale.rangeRound([0, chart.width - chart.padding.yAxis - 5].map(d => e.transform.invertX(d)));
            let newLine = d3.line<IReflectionAuthorEntry>()
                .x(d => chart.x.scale(d.timestamp))
                .y(d => chart.y.scale(d.point));

            chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`)
                .attr("cx", (d: IReflectionAuthorEntry) => chart.x.scale(d.timestamp));

            chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`)
                .attr("d", (d: IReflectionAuthorEntry[]) => newLine(d));

            chart.elements.contentContainer.selectAll(".click-container")
                .attr("transform", (d: IReflectionAuthorEntry) => `translate(${chart.x.scale(d.timestamp)}, ${chart.y.scale(d.point)})`)

            chart.elements.zoomFocus.selectAll(".zoom-content")
                .attr("cx", (d: IReflectionAuthorEntry) => zoomChart.x.scale(d.timestamp));

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
        }
        return chart;
    };
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): void {
        let _this = this
        d3.select("#group-timeline #timeline-plot").on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            if (selectedOption == "density") {
                _this.htmlContainers.removeUsers();
                _this.renderTimelineDensity(chart, data);
            }
            if (selectedOption == "scatter") {
                _this.renderTimelineScatter(chart, zoomChart, data);
            }
        });
    };
    renderUserStatistics(card: any, data: IAnalyticsChartsData, pseudonym?: string): void {
        let userData = data.getUsersData(data);
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
        .attr("class", (d: IReflectionAuthorEntry, i: number) => `list-group-item list-group-item-action ${pseudonym == undefined ? i == 0 ? "active" : "" : d.pseudonym == pseudonym ? "active" : ""}`)
        .attr("data-toggle", "list")
        .attr("href", (d: IReflectionAuthorEntry) => `#${userData.group}-${d.pseudonym}`)
        .html((d: IReflectionAuthorEntry) => d.pseudonym);
        
        let tabPane = cardRow.append("div")
        .attr("class", "col-md-9")
        .append("div")
        .attr("class", "tab-content")
        .selectAll("div")
        .data(userData.value)
        .enter()
        .append("div")
        .attr("class", (d: IReflectionAuthorEntry, i: number) => `tab-pane fade ${pseudonym == undefined ? i == 0 ? "show active" : "" : d.pseudonym == pseudonym ? "show active" : ""}`)
        .attr("id", (d: IReflectionAuthorEntry) => `${userData.group}-${d.pseudonym}`)
        .html((d: IReflectionAuthorEntry) => `<div class="row">
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
            .data((d: IReflectionAuthorEntry) => d3.sort(d3.filter(data.value, x => x.pseudonym == d.pseudonym), r => r.timestamp))
            .enter()
            .append("p")
            .html((d: IReflectionAuthorEntry) => `<b>${d.timestamp.toDateString()} - State: ${d.point}</b><br>${d.text}`);
        cardRow.select(".scroll-list")
            .style("height", `${cardRow.select(".tab-pane.fade.show.active").node().getBoundingClientRect().height}px`);
        cardRow.selectAll("a")
            .on("click", function () {
                setTimeout(() => {cardRow.select(".scroll-list")
                    .transition()
                    .duration(750)
                    .style("height", `${cardRow.select(".tab-pane.fade.show.active").node().getBoundingClientRect().height}px`)}, 250);
            });
    };
}

interface IAdminControlTransitions {
    axisSeries(chart: ChartSeries, data: IAnalyticsChartsData[]): void;
    axisTime(chart: ChartTime, data: IAnalyticsChartsData): void;
    bars(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): void;
    circles(chart: ChartTime, data: IAnalyticsChartsData): void;
    circlesZoom(chart: ChartTime, chartZoom: ChartTimeZoom, data: IAnalyticsChartsData): void;
    violin(chart: ViolinChartSeries, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number): void;
    density(chart: ChartTime, data: d3.ContourMultiPolygon[]): void;
}

class AdminControlTransitions implements IAdminControlTransitions {
    axisSeries(chart: ChartSeries, data: IAnalyticsChartsData[]): void {
        chart.x.scale.domain(data.map(d => d.group));
        d3.select(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    axisTime(chart: ChartTime, data: IAnalyticsChartsData): void {
        chart.x.scale.domain(d3.extent(data.value.map(d => d.timestamp)));
        d3.select(`#${chart.id} .x-axis`).transition()
            .duration(750)
            .call(chart.x.axis);
    };
    bars(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): void {
        d3.selectAll(`#${chart.id} .content-container #${chart.id}-data`)
            .data(data)
            .transition()
            .duration(750)
            .attr("width", (d: IAnalyticsChartsDataStats) => chart.x.scale.bandwidth())
            .attr("height", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.q1) - chart.y.scale(d.q3))
            .attr("y", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.q3))
            .attr("x", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group));

        d3.selectAll(`#${chart.id} #${chart.id}-data-min-max`)
            .data(data)
            .transition()
            .duration(750)
            .attr("x1", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
            .attr("y1", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.min))
            .attr("x2", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2))
            .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.max));

        d3.selectAll(`#${chart.id} #${chart.id}-data-median`)
            .data(data)
            .transition()
            .duration(750)
            .attr("x1", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group))
            .attr("y1", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.median))
            .attr("x2", (d: IAnalyticsChartsDataStats) => chart.x.scale(d.group) + chart.x.scale.bandwidth())
            .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.median));
    };
    circles(chart: ChartTime, data: IAnalyticsChartsData): void {
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`)
            .data(data.value)
            .transition()
            .duration(750)
            .attr("r", 5)
            .attr("cx", (d: IReflectionAuthorEntry) => chart.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => chart.y.scale(d.point));
    };
    circlesZoom(chart: ChartTime, chartZoom: ChartTimeZoom, data: IAnalyticsChartsData): void {
        chart.elements.zoomSVG.selectAll(`#${chart.id}-zoom-bar-content`)
            .data(data.value)
            .transition()
            .duration(750)
            .attr("r", 2)
            .attr("cx", (d: IReflectionAuthorEntry) => chartZoom.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => chartZoom.y.scale(d.point));
    };
    violin(chart: ViolinChartSeries, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number): void {
        //Create bandwidth scale
        let bandwithScale = d3.scaleLinear()
            .range([0, chart.x.scale.bandwidth()])
            .domain([-d3.max(data.map(r => r.value.length)), d3.max(data.map(r => r.value.length))]);

        //Create bins             
        let bin = d3.bin().domain([0, 100]).thresholds([0, tDistressed, tSoaring]);

        //Draw violins
        chart.elements.contentContainer.selectAll(`.${chart.id}-violin-container`).select("path")
            .datum((d: IAnalyticsChartsData) => bin(d.value.map(d => d.point)))
            .transition()
            .duration(750)
            .attr("d", d3.area()
                .x0((d: number[]) => bandwithScale(-d.length))
                .x1((d: number[]) => bandwithScale(d.length))
                .y((d: number[], i: number) => chart.y.scale(i == 0 ? 0 : i == 1 ? 50 : 100))
                .curve(d3.curveCatmullRom));

        //Draw threshold percentages
        chart.elements.appendThresholdPercentages(chart, bin, bandwithScale, tDistressed, tSoaring);
    };
    density(chart: ChartTime, data: d3.ContourMultiPolygon[]): void {
        chart.elements.contentContainer.selectAll(`${chart.id}-timeline-contours`)
            .data(data)
            .transition()
            .duration(750)
            .attr("d", d3.geoPath())
            .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
            .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));
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
/* ------------------------------------------------
    End of admin control interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of admin experimental interfaces and classes 
-------------------------------------------------- */
interface IAdminExperimentalCharts extends IAdminControlCharts {
    violin: IViolinChartSeries;
    usersViolin: IViolinChartSeries;
    timeline: ChartTime;
    timelineZoom: ChartTimeZoom;
    sorted: string;
    allEntries: IAnalyticsChartsData[];
    handleGroups(boxPlot: ChartSeries): void;
    handleGroupsColours(chart: ChartSeries): void;
    handleGroupsSort(boxPlot: ChartSeries): void;
    getGroupCompareData(data: IAnalyticsChartsData[], id: string): IAnalyticsChartsData[];
    renderGroupCompare(data: IAnalyticsChartsData[], id: string): any;
    handleGroupCompare(data: IAnalyticsChartsData[], compareData: IAnalyticsChartsData[]): void;
}

class AdminExperimentalCharts extends AdminControlCharts implements IAdminExperimentalCharts {
    violin: ViolinChartSeries;
    usersViolin: ViolinChartSeries;
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
            chart.x = new ChartSeriesAxis("Group Code", data.map(r => r.group), [0, chart.width - chart.padding.yAxis - chart.padding.right]);
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
                    _this.interactions.click.appendGroupsText(boxPlot, data, data[data.map(d => d.group).indexOf(d3.select("#groups-statistics .card").attr("id"))]);
                    _this.getGroupCompareData();
                    _this.renderGroupCompare();
                    _this.handleGroupCompare();
                }
            } else {
                _this.allEntries.find(d => d.group == target.value).selected = false;
                let data = updateData(boxPlot);
                updateGroupChart(boxPlot, data);
                boxPlot.elements.contentContainer.selectAll(`#${boxPlot.id} .content-container .click-container`)
                    .data(data)
                    .exit()
                    .remove();
                if (boxPlot.click) {
                    if (target.value == d3.select("#groups-statistics .card").attr("id")) {
                        _this.interactions.click.removeClick(boxPlot);
                        _this.interactions.click.removeClickClass(boxPlot, "bar");
                        _this.htmlContainers.remove();
                    } else {
                        _this.interactions.click.appendGroupsText(boxPlot, data, data[data.map(d => d.group).indexOf(d3.select("#groups-statistics .card").attr("id"))]);
                        let violinData = _this.getGroupCompareData();
                        _this.renderGroupCompare();
                        _this.violin.x = new ChartSeriesAxis("Group Code", violinData.map(r => r.group), [0, _this.violin.width - _this.violin.padding.yAxis - _this.violin.padding.right]);
                        _this.usersViolin.x = new ChartSeriesAxis("Group Code", violinData.map(r => r.group), [0, _this.usersViolin.width - _this.usersViolin.padding.yAxis - _this.usersViolin.padding.right]);
                        _this.handleGroupCompare();
                        _this.renderViolin(_this.violin, violinData);
                        _this.renderViolin(_this.usersViolin, violinData);
                        _this.interactions.axisSeries(_this.violin, violinData);
                        _this.interactions.axisSeries(_this.usersViolin, violinData);
                    }
                }
            }
        });
    };
    handleGroupsColours(boxPlot: ChartSeries): void {
        let _this = this;
        d3.selectAll("#groups input[type=color]").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            let groupId = target.id.replace("colour-","");
            _this.allEntries.find(d => d.group == groupId).colour = target.value;
            let entries = d3.filter(_this.allEntries, d => d.selected);
            let data = entries.map(d => new AnalyticsChartsDataStats(d));
            _this.renderGroupChart(boxPlot, data);
            if(boxPlot.click) {
                let currentClickGroup = d3.select("#groups-statistics .card").attr("id");
                let violinData = _this.getGroupCompareData();
                if(violinData.map(d => d.group).includes(groupId)) {
                    let violinData = _this.getGroupCompareData();
                    _this.renderViolin(_this.violin, violinData);
                    let usersData = violinData.map(d => {
                        return d.getUsersData(d)
                    });
                    _this.renderViolin(_this.usersViolin, usersData);
                    _this.handleGroupCompare();
                }
                if(currentClickGroup == groupId) {
                    if (_this.timeline.elements.contentContainer.selectAll(`#${_this.timeline.id}-timeline-contours`).empty()) {
                        _this.renderTimelineScatter(_this.timeline, _this.timelineZoom, _this.allEntries.find(d => d.group == groupId));
                    } else {
                        _this.timeline.elements.contentContainer.selectAll(`#${_this.timeline.id}-timeline-contours`).remove();
                        _this.renderTimelineDensity(_this.timeline, _this.allEntries.find(d => d.group == groupId));
                    }
                }               
            }
        });
    };
    handleGroupsSort(boxPlot: ChartSeries): void {
        let _this = this;
        d3.select("#groups-chart #sort-by").on("click", (e: any) => {
            var selectedOption = e.target.control.value;
            _this.allEntries = _this.allEntries.sort(function (a, b) {
                if(selectedOption == "date") {
                    return _this.interactions.sort.sortData(a.creteDate, b.creteDate, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "name") {
                    return _this.interactions.sort.sortData(a.group, b.group, _this.sorted == "name" ? true : false);
                } else if (selectedOption == "mean") {
                    return _this.interactions.sort.sortData(d3.mean(a.value.map(d => d.point)), d3.mean(b.value.map(d => d.point)), _this.sorted == "mean" ? true : false);
                }                   
            });
            _this.sorted = SetSorted();
            function SetSorted() {
                if(selectedOption == "date") {
                    return _this.sorted == "date" ? "" : "date";
                } else if (selectedOption == "name") {
                    return _this.sorted == "name" ? "" : "name";
                } else if (selectedOption == "mean") {
                    return _this.sorted == "mean" ? "" : "mean";
                }
            }                
            let entries = d3.filter(_this.allEntries, d => d.selected);
            let data = entries.map(d => new AnalyticsChartsDataStats(d));
            boxPlot.x = new ChartSeriesAxis("Group Code", data.map(r => r.group), [0, boxPlot.width - boxPlot.padding.yAxis - boxPlot.padding.right]);
            _this.interactions.axisSeries(boxPlot, data);
            _this.renderGroupChart(boxPlot, data);
        });
    };
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries {
        chart = super.renderGroupChart(chart, data);
        let _this = this
        _this.interactions.click.enableClick(chart, onClick);
        chart.elements.contentContainer.select(".zoom-rect").on("click", () => {
            _this.interactions.click.removeClick(chart);
            _this.interactions.click.removeClickClass(chart, "bar");
            _this.htmlContainers.remove();
        });
        function onClick(e: Event, d: IAnalyticsChartsDataStats) {
            if (d3.select(this).attr("class") == "bar clicked") {
                _this.interactions.click.removeClick(chart);
                d3.select(this).attr("class", "bar");
                _this.htmlContainers.remove();
                return;
            }
            _this.interactions.click.removeClick(chart);
            _this.interactions.click.removeClickClass(chart, "bar");
            _this.htmlContainers.remove();
            chart.click = true;
            _this.interactions.click.appendGroupsText(chart, data, d);

            //Draw group statistics
            _this.htmlContainers.groupStatistics = _this.htmlContainers.appendDiv("groups-statistics", "col-md-3");
            let groupsStatisticsCard = _this.htmlContainers.appendCard(_this.htmlContainers.groupStatistics, `Statitics (${d.group})`, d.group);
            _this.renderGroupStats(groupsStatisticsCard, d)

            //Draw compare
            _this.htmlContainers.compare = _this.htmlContainers.appendDiv("group-compare", "col-md-2 mt-3");
            let compareCard = _this.htmlContainers.appendCard(_this.htmlContainers.compare, `Compare ${d.group} with:`);
            compareCard.select(".card-body").attr("class", "card-body");
            let violinData = _this.getGroupCompareData();
            _this.renderGroupCompare();

            //Draw groups violin container  
            _this.htmlContainers.groupViolin = _this.htmlContainers.appendDiv("group-violin-chart", "col-md-5 mt-3");
            _this.htmlContainers.appendCard(_this.htmlContainers.groupViolin, `Reflections distribution (${d.group})`);
            _this.violin = new ViolinChartSeries("group-violin-chart", violinData.map(d => d.group));
            _this.violin.elements.preRender(_this.violin);
            _this.violin.elements.renderViolinThresholds(_this.violin, [30, 70]);
            _this.violin = _this.renderViolin(_this.violin, violinData);

            //Draw users violin container
            _this.htmlContainers.userViolin = _this.htmlContainers.appendDiv("group-violin-users-chart", "col-md-5 mt-3");
            _this.htmlContainers.appendCard(_this.htmlContainers.userViolin, `Users distribution (${d.group})`);
            let usersData = violinData.map(d => {
                return d.getUsersData(d)
            });
            _this.usersViolin = new ViolinChartSeries("group-violin-users-chart", violinData.map(d => d.group));
            _this.usersViolin.elements.preRender(_this.usersViolin);
            _this.usersViolin.elements.renderViolinThresholds(_this.usersViolin, [30, 70]);
            _this.usersViolin = _this.renderViolin(_this.usersViolin, usersData);
            _this.handleGroupCompare();

            //Draw selected group timeline 
            _this.htmlContainers.groupTimeline = _this.htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
            let timelineCard = _this.htmlContainers.appendCard(_this.htmlContainers.groupTimeline, `Reflections vs Time (${d.group})`);
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
            _this.timeline.elements.preRender(_this.timeline);
            _this.renderTimelineDensity(_this.timeline, d);
            _this.timelineZoom = new ChartTimeZoom(_this.timeline, d3.extent(d.value.map(d => d.timestamp)));
            _this.handleTimelineButtons(_this.timeline, _this.timelineZoom, d);

            //Scroll
            document.querySelector("#groups-statistics").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        //Enable sort
        if(d3.select(".y-label-container .sort-arrow").empty()) {
            _this.interactions.sort.appendArrow(chart, false, true);
        }
        d3.select(".y-label-container").on("click", function () {
            chart.y.sorted = chart.y.sorted == false ? true : false;
            _this.interactions.sort.arrowTransition(chart, false, true);
            data = data.sort(function (a, b) {
                return _this.interactions.sort.sortData(a.mean, b.mean, chart.y.sorted);
            });

            _this.interactions.axisSeries(chart, data);
            _this.interactions.bars(chart, data);
            if (chart.click) {
                _this.interactions.click.appendGroupsText(chart, data, data[data.map(d => d.group).indexOf(d3.select("#groups-statistics .card").attr("id"))])
            }
        });
        return chart;
    };
    renderViolin(chart: ViolinChartSeries, data: IAnalyticsChartsData[]): ViolinChartSeries {
        let _this = this;
        chart = super.renderViolin(chart, data);
        let thresholds = chart.elements.getThresholdsValues(chart);
        let tDistressed = thresholds[0];
        let tSoaring = thresholds[1];

        //Add drag functions to the distressed threshold
        chart.elements.contentContainer.select(".threshold-line.distressed")
            .call(d3.drag()
                .on("start", dragStartDistressed)
                .on("drag", draggingDistressed)
                .on("end", dragEndDistressed));

        //Add drag functions to the soaring threshold
        chart.elements.contentContainer.select(".threshold-line.soaring")
            .call(d3.drag()
                .on("start", dragStartSoaring)
                .on("drag", draggingSoaring)
                .on("end", dragEndSoaring));

        //Start drag soaring functions           
        function dragStartSoaring(e: Event, d: IAnalyticsChartsData) {
            chart.elements.contentContainer.selectAll(`.${chart.id}-violin-text-container`).remove();
            d3.select(this).attr("class", d3.select(this).attr("class") + " grabbing")
        }
        function draggingSoaring(e: MouseEvent, d: IAnalyticsChartsData) {
            if (chart.y.scale.invert(e.y) < 51 || chart.y.scale.invert(e.y) > 99) {
                return;
            }
            d3.select(this)
                .attr("y1", chart.y.scale(chart.y.scale.invert(e.y)))
                .attr("y2", chart.y.scale(chart.y.scale.invert(e.y)));
            tSoaring = chart.y.scale.invert(e.y);
            chart.thresholdAxis.tickValues([tDistressed, chart.y.scale.invert(e.y)])
                .tickFormat((d: number) => d == tDistressed ? "Distressed" : d == chart.y.scale.invert(e.y) ? "Soaring" : "");
            chart.elements.contentContainer.selectAll(".threshold-axis")
                .call(chart.thresholdAxis);
            let positionX = chart.width - chart.padding.yAxis - chart.padding.right + 5;
            let positionY = chart.y.scale(tSoaring) + 25;
            let indicator = chart.elements.contentContainer.select(".threshold-indicator-container.soaring");
            if (positionY + indicator.node().getBBox().height > chart.y.scale(tDistressed)) {
                positionY = chart.y.scale(tSoaring) - 15;
            }
            indicator.attr("transform", `translate(${positionX}, ${positionY})`);
            indicator.select("text")
                .text(Math.round(tSoaring));

        }
        function dragEndSoaring(e: MouseEvent, d: IAnalyticsChartsData) {
            let newT = chart.y.scale.invert(e.y);
            if (newT < 51) {
                newT = 51;
            }
            if (newT > 99) {
                newT = 99;
            }
            _this.interactions.violin(chart, data, tDistressed, newT);
            d3.select(this).attr("class", d3.select(this).attr("class").replace(" grabbing", ""));
        }

        //Start drag distressed functions
        function dragStartDistressed(e: Event, d: IAnalyticsChartsData) {
            chart.elements.contentContainer.selectAll(`.${chart.id}-violin-text-container`).remove();
            d3.select(this).attr("class", d3.select(this).attr("class") + " grabbing");
        }
        function draggingDistressed(e: MouseEvent, d: IAnalyticsChartsData) {
            if (chart.y.scale.invert(e.y) < 1 || chart.y.scale.invert(e.y) > 49) {
                return;
            }
            d3.select(this)
                .attr("y1", chart.y.scale(chart.y.scale.invert(e.y)))
                .attr("y2", chart.y.scale(chart.y.scale.invert(e.y)));

            tDistressed = chart.y.scale.invert(e.y);
            chart.thresholdAxis.tickValues([chart.y.scale.invert(e.y), tSoaring])
                .tickFormat((d: number) => d == chart.y.scale.invert(e.y) ? "Distressed" : d == tSoaring ? "Soaring" : "");

            chart.elements.contentContainer.selectAll(".threshold-axis")
                .call(chart.thresholdAxis);

            let soaringIndicator = chart.elements.contentContainer.select(".threshold-indicator-container.soaring");
            if (chart.y.scale(tDistressed) < chart.y.scale(tSoaring) + soaringIndicator.node().getBBox().height + 25) {
                soaringIndicator.attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${chart.y.scale(tSoaring) - 15})`);
            } else {
                soaringIndicator.attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${chart.y.scale(tSoaring) + 25})`);
            }

            let indicator = chart.elements.contentContainer.select(".threshold-indicator-container.distressed")
                .attr("transform", `translate(${chart.width - chart.padding.yAxis - chart.padding.right + 5}, ${chart.y.scale(tDistressed) + 25})`)
            indicator.select("text")
                .text(Math.round(tDistressed));
        }
        function dragEndDistressed(e: MouseEvent, d: IAnalyticsChartsData) {
            let newT = chart.y.scale.invert(e.y);
            if (newT < 1) {
                newT = 1;
            }
            if (newT > 49) {
                newT = 49;
            }
            _this.interactions.violin(chart, data, newT, tSoaring);
            d3.select(this).attr("class", d3.select(this).attr("class").replace(" grabbing", ""));
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
            _this.interactions.click.removeClickClass(chart, "line-circle");
            chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
            _this.htmlContainers.removeUsers();
        });
        function onClick(e: Event, d: IReflectionAuthorEntry) {
            if (d3.select(this).attr("class") == "line-circle clicked") {
                _this.interactions.click.removeClick(chart);
                chart.elements.content.attr("class", "line-circle");
                chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
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
                .datum(d3.sort(userData, (d: IReflectionAuthorEntry) => d.timestamp))
                .classed("line", true)
                .attr("id", `${chart.id}-timeline-circles-line`)
                .attr("d", (d: IReflectionAuthorEntry[]) => line(d))
                .style("stroke", data.colour);

            //Draw click containers
            userData.forEach(c => _this.interactions.click.appendScatterText(chart, c, c.point.toString()));

            //Draw user statistics container
            _this.htmlContainers.userStatistics = _this.htmlContainers.appendDiv("user-statistics", "col-md-12 mt-3");
            let userStatisticsCard = _this.htmlContainers.appendCard(_this.htmlContainers.userStatistics, `${d.pseudonym}'s statistics`);
            _this.renderUserStatistics(userStatisticsCard, data, d.pseudonym);
           
            //Scroll
            document.querySelector("#group-timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    renderGroupCompare(): any {
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
            let selectedCompareData = _this.getGroupCompareData();
            let groupData = d3.filter(_this.allEntries, d => selectedCompareData.includes(d));
            let usersData = groupData.map(d => d.getUsersData(d));

            _this.violin.x = new ChartSeriesAxis("Group Code", groupData.map(r => r.group), [0, _this.violin.width - _this.violin.padding.yAxis - _this.violin.padding.right]);
            _this.usersViolin.x = new ChartSeriesAxis("Group Code", groupData.map(r => r.group), [0, _this.usersViolin.width - _this.usersViolin.padding.yAxis - _this.usersViolin.padding.right]);
            _this.interactions.axisSeries(_this.violin, groupData);
            _this.interactions.axisSeries(_this.usersViolin, usersData);
            _this.renderViolin(_this.violin, groupData);
            _this.renderViolin(_this.usersViolin, usersData);
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
                    .x(d =>  _this.timeline.x.scale(d.timestamp))
                    .y(d =>  _this.timeline.y.scale(d.point));

                _this.timeline.elements.contentContainer.append("path")
                    .datum(d3.sort(userData, (d: IReflectionAuthorEntry) => d.timestamp))
                    .classed("line", true)
                    .attr("id", `${ _this.timeline.id}-timeline-circles-line`)
                    .attr("d", (d: IReflectionAuthorEntry[]) => line(d))
                    .style("stroke", data.colour);
                userData.forEach(c => _this.interactions.click.appendScatterText(_this.timeline, c, c.point.toString()));
                card.select(".card-header")
                    .html(`${d.pseudonym} statistics`);
                    setTimeout(() => {card.select(".scroll-list")
                    .transition()
                    .duration(750)
                    .style("height", `${card.select(".tab-pane.fade.show.active").node().getBoundingClientRect().height}px`)}, 250);
            })
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
/* ------------------------------------------------
    End of admin experimental interfaces and classes
-------------------------------------------------- */

export function buildControlAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]) {
    let rawData = entriesRaw.map(d => new AnalyticsChartsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData(d));
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
        adminControlCharts.htmlContainers.groupsChart = adminControlCharts.htmlContainers.appendDiv("groups-chart", "col-md-9");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.groupsChart, "Reflections box plot by group");

        //Create group chart with current data
        let groupChart = new ChartSeries("groups-chart", data.map(d => d.group));
        groupChart.elements.preRender(groupChart);
        adminControlCharts.renderGroupChart(groupChart, data);

        //Append group general statistics
        adminControlCharts.htmlContainers.groupStatistics = adminControlCharts.htmlContainers.appendDiv("groups-statistics", "col-md-3");
        let cardGroupStats = adminControlCharts.htmlContainers.groupStatistics.selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "card");
        cardGroupStats.each((d: IAnalyticsChartsDataStats, i: number, g: any) => {
            d3.select(g[i])
                .append("div")
                .attr("class", "card-header")
                .append("button")
                .attr("class", "btn btn-link")
                .attr("data-target", `#stats-${d.group}`)
                .attr("data-toggle", "collapse")
                .html(`${d.group} statistics`);
            d3.select(g[i])
                .append("div")
                .attr("id", `stats-${d.group}`)
                .attr("class", `collapse ${i == 0 ? "show" : ""}`)
                .attr("data-parent", "#groups-statistics")
                .append("div")
                .attr("class", "card-body");
            adminControlCharts.renderGroupStats(d3.select(g[i]), d);
        });

        //Draw groups violin container  
        adminControlCharts.htmlContainers.groupViolin = adminControlCharts.htmlContainers.appendDiv("group-violin-chart", "col-md-6 mt-3");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.groupViolin, `Reflections distribution`);
        let violinChart = new ViolinChartSeries("group-violin-chart", data.map(d => d.group));
        violinChart.elements.preRender(violinChart);
        violinChart.elements.renderViolinThresholds(violinChart, [30, 70]);
        adminControlCharts.renderViolin(violinChart, data);

        //Draw users violin container
        adminControlCharts.htmlContainers.userViolin = adminControlCharts.htmlContainers.appendDiv("group-violin-users-chart", "col-md-6 mt-3");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.userViolin, `Users distribution`);
        let usersData = data.map(d => {
            return d.getUsersData(d)
        });
        let violinUsersChart = new ViolinChartSeries("group-violin-users-chart", data.map(d => d.group));
        violinUsersChart.elements.preRender(violinUsersChart);
        violinUsersChart.elements.renderViolinThresholds(violinUsersChart, [30, 70]);
        adminControlCharts.renderViolin(violinUsersChart, usersData);

        //Draw selected group timeline 
        adminControlCharts.htmlContainers.groupTimeline = adminControlCharts.htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
        let timelineCard = adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.groupTimeline, `Reflections vs Time`);
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
            .attr("class", (d: IAnalyticsChartsDataStats, i: number) => `nav-link ${i == 0 ? "active" : ""}`)
            .attr("href", (d: IAnalyticsChartsDataStats) => `#timeline-${d.group}`)
            .html((d: IAnalyticsChartsDataStats) => d.group);
        timelineCard.select(".card-body")
            .append("div")
            .attr("class", "row mt-3")
            .html((d: IAnalyticsChartsDataStats) => `<div id="timeline-plot" class="btn-group btn-group-toggle mr-auto ml-auto" data-toggle="buttons">
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
        timelineChart.elements.preRender(timelineChart);
        adminControlCharts.renderTimelineDensity(timelineChart, data[0]);
        let timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(data[0].value.map(d => d.timestamp)));
        adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, data[0]);

        timelineCard.selectAll("a")
            .on("click", (e: Event, d: IAnalyticsChartsDataStats) => {
                timelineCard.selectAll("a")
                    .each((x: IAnalyticsChartsDataStats, i: number, g: any) => {
                        if(x == d) {
                            d3.select(g[i])
                                .attr("class", "nav-link active")
                        } else {
                            d3.select(g[i])
                                .attr("class", "nav-link")
                        }
                    });
                timelineChart.x = new ChartTimeAxis("Time", d3.extent(d.value.map(d => d.timestamp)), [0, timelineChart.width - timelineChart.padding.yAxis]);
                timelineZoomChart.x = new ChartTimeAxis("Time", d3.extent(d.value.map(d => d.timestamp)), [0, timelineChart.width - timelineChart.padding.yAxis]);
                adminControlCharts.interactions.axisTime(timelineChart, d);
                if (timelineChart.elements.contentContainer.selectAll(`#${timelineChart.id}-timeline-contours`).empty()) {
                    adminControlCharts.renderTimelineScatter(timelineChart, timelineZoomChart, d);
                } else {
                    timelineChart.elements.contentContainer.selectAll(`#${timelineChart.id}-timeline-contours`).remove();
                    adminControlCharts.renderTimelineDensity(timelineChart, d);
                }
                adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, d);
            });
        
        adminControlCharts.htmlContainers.userStatistics = adminControlCharts.htmlContainers.appendDiv("user-statistics", "col-md-12 mt-3");
        let usersCards = adminControlCharts.htmlContainers.userStatistics.selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "card");
        usersCards.each((d: IAnalyticsChartsData, i: number, g: any) => {
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
                setTimeout(() => {usersCards.select(`${buttonId} .scroll-list`)
                    .transition()
                    .duration(750)
                    .style("height", `${usersCards.select(`${buttonId} .tab-pane.fade.show.active`).node().getBoundingClientRect().height}px`)}, 250);
            });
    }
}

export function buildExperimentAdminAnalyticsCharts(entriesRaw: IAnalyticsChartsDataRaw[]) {
    let rawData = entriesRaw.map(d => new AnalyticsChartsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData(d));
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
        adminExperimentalCharts.htmlContainers.groupsChart = adminExperimentalCharts.htmlContainers.appendDiv("groups-chart", "col-md-9");
        let groupCard = adminExperimentalCharts.htmlContainers.appendCard(adminExperimentalCharts.htmlContainers.groupsChart, "Reflections box plot by group");
        groupCard.select(".card-body")
            .attr("class", "card-body")
            .html(`<div class="row">
                        <span class="mx-2"><small>Sort by:</small></span>
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
        groupChart.elements.preRender(groupChart);
        groupChart = adminExperimentalCharts.renderGroupChart(groupChart, data);

        //Update charts depending on group
        adminExperimentalCharts.handleGroups(groupChart);
        adminExperimentalCharts.handleGroupsColours(groupChart);
        adminExperimentalCharts.handleGroupsSort(groupChart);
    }
}