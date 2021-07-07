import * as d3 from "d3";

interface IReflectionAuthorEntry {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}

interface IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    selected: boolean;
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData;
}

class AnalyticsChartsData implements IAnalyticsChartsData {
    group: string;
    value: IReflectionAuthorEntry[];
    selected: boolean;
    constructor(group: string, value: IReflectionAuthorEntry[], selected: boolean = false) {
        this.group = group;
        this.value = value;
        this.selected = selected;
    }
    getUsersData(data: IAnalyticsChartsData): AnalyticsChartsData {
        let usersMean = Array.from(d3.rollup(data.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
        return new AnalyticsChartsData(data.group, usersMean);
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
        super(entries.group, entries.value, entries.selected);
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
            .attr("x", bandwithScale(0) - binText.node().getBBox().width / 2)
            .on("mouseover", onMouseover)
            .on("mouseout", onMouseout);
        function positionY(i: number) {
            return chart.y.scale(i == 0 ? tDistressed / 2 : i == 1 ? 50 : (100 - tSoaring) / 2 + tSoaring) - binTextBox.node().getBBox().height / 2
        }
        function onMouseover(e: any, d: IBinData) {
            chartFunctions.tooltip.appendTooltipText(chart, `Count: ${d.bin.length.toString()}`);
            chartFunctions.tooltip.positionTooltipContainer(chart, bandwithScale(0) + (3 * binTextBox.node().getBBox().width), parseInt(d3.select(this).attr("y")) - binTextBox.node().getBBox().height);
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            chartFunctions.tooltip.removeTooltip(chart);
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

// Basic interface for tooltip content
interface ITooltipValues {
    label: string;
    value: number;
}

// Basic class for tooltip content
class TooltipValues implements ITooltipValues {
    label: string;
    value: number;
    constructor(label?: string, value?: number) {
        this.label = label == undefined ? "" : label;
        this.value = value == undefined ? 0 : value;
    }
}

// Interface for tooltip
interface ITooltip {
    enableTooltip(chart: IChart, onMouseover: any, onMouseout: any): void;
    removeTooltip(chart: IChart): void
    appendTooltipContainer(chart: IChart): void;
    appendTooltipText(chart: IChart, title: string, values: ITooltipValues[]): void;
    positionTooltipContainer(chart: IChart, x: number, y: number): void;
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number): void;
}

// Class for tooltip
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
    appendLine(chart: IChart, x1: number, y1: number, x2: number, y2: number): void {
        chart.elements.contentContainer.append("line")
            .attr("class", "tooltip-line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    };
}

// Interface for zoom
interface IZoom {
    enableZoom(chart: ChartTime, zoomed: any): void;
    appendZoomBar(chart: ChartTime): any;
}

// Class for zoom
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

/* ------------------------------------------------
    Start of admin control interfaces and classess 
-------------------------------------------------- */
interface IAdminControlCharts {
    interactions: IAdminControlInteractions;
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[];
    handleGroups(boxPlot: ChartSeries, violin: ViolinChartSeries, usersViolin: ViolinChartSeries, timeline: ChartTime, timelineZoom: ChartTimeZoom, allEntries: IAnalyticsChartsData[]): void;
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries;
    renderGroupStats(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsDataStats): d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    renderViolin(chart: ViolinChartSeries, data: IAnalyticsChartsData[]): ViolinChartSeries;
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData): ChartTime;
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): ChartTime;
    handleTimelineButtons(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData): void
}

class AdminControlCharts implements IAdminControlCharts {
    interactions = new AdminControlInteractions();
    preloadGroups(allEntries: IAnalyticsChartsData[]): IAnalyticsChartsData[] {
        d3.selectAll("#groups input").each(function () {
            d3.select(this).attr("checked") == null ? "" : allEntries.find(d => d.group == d3.select(this).attr("value")).selected = true;
        });
        return d3.filter(allEntries, d => d.selected == true);
    };
    handleGroups(boxPlot: ChartSeries, violin: ViolinChartSeries, usersViolin: ViolinChartSeries, timeline: ChartTime, timelineZoom: ChartTimeZoom, allEntries: IAnalyticsChartsData[]): void {
        d3.selectAll("#groups input").on("change", (e: Event) => {
            let target = e.target as HTMLInputElement;
            allEntries.find(d => d.selected == true).selected = false;
            allEntries.find(d => d.group == target.value).selected = true;
            let entries = d3.filter(allEntries, d => d.selected == true);
            boxPlot.x = new ChartSeriesAxis("Group Code", entries.map(r => r.group), [0, boxPlot.width - boxPlot.padding.yAxis - boxPlot.padding.right]);
            this.interactions.axisSeries(boxPlot, entries);
            this.renderGroupChart(boxPlot, entries.map(d => new AnalyticsChartsDataStats(d)));
            this.renderGroupStats(d3.select("#groups-statistics"), new AnalyticsChartsDataStats(entries[0]));
            violin.x = new ChartSeriesAxis("Group Code", entries.map(r => r.group), [0, violin.width - violin.padding.yAxis - violin.padding.right]);
            this.interactions.axisSeries(violin, entries);
            this.renderViolin(violin, entries);
            usersViolin.x = new ChartSeriesAxis("Group Code", entries.map(r => r.group), [0, usersViolin.width - usersViolin.padding.yAxis - usersViolin.padding.right]);
            this.interactions.axisSeries(usersViolin, entries);
            let usersData = entries.map(d => {
                return d.getUsersData(d)
            });
            this.renderViolin(usersViolin, usersData);
            timeline.x = new ChartTimeAxis("Time", d3.extent(entries[0].value.map(d => d.timestamp)), [0, timeline.width - timeline.padding.yAxis]);
            this.interactions.axisTime(timeline, entries[0]);
            if (timeline.elements.contentContainer.selectAll(`#${timeline.id}-timeline-contours`).empty()){
                this.renderTimelineScatter(timeline, timelineZoom, entries[0]);               
            } else {
                timeline.elements.contentContainer.selectAll(`#${timeline.id}-timeline-contours`).remove();
                this.renderTimelineDensity(timeline, entries[0]);
            }  
            this.handleTimelineButtons(timeline, timelineZoom, entries[0]);       
        })
    };
    renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]): ChartSeries {
        //Select existing minMax lines
        let minMax = chart.elements.contentContainer.selectAll(`#${chart.id}-data-min-max`)
            .data(data);

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
            .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.max));

        //Merge existing and new minMax lines
        minMax.merge(minMaxEnter);

        //Select existing median lines
        let median = chart.elements.contentContainer.selectAll(`#${chart.id}-data-median`)
            .data(data);

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
            .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.median));

        //Merge existing and new median lines
        median.merge(medianEnter);

        //Select existing boxes
        let boxes = chart.elements.contentContainer.selectAll(`#${chart.id}-data`)
            .data(data);

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
            .attr("height", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.q1) - chart.y.scale(d.q3));

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
    renderGroupStats(div: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAnalyticsChartsDataStats): d3.Selection<d3.BaseType, unknown, HTMLElement, any> {
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

        //Append new bin containers
        let binContainerEnter = binContainer.enter()
            .append("g")
            .attr("class", `${chart.id}-violin-container`)
            .attr("transform", (d: IAnalyticsChartsData) => `translate(${chart.x.scale(d.group)}, 0)`);

        //Draw violins
        binContainerEnter.append("path")
            .attr("id", `${chart.id}-violin`)
            .attr("class", "violin-path")
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

        return chart;
    };
    renderTimelineDensity(chart: ChartTime, data: IAnalyticsChartsData) {
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
            .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
            .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));

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
                .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
                .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));

            zoomContours.attr("d", d3.geoPath())
                .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
                .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));

            zoomContours.merge(zoomContoursEnter);

            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
        }
        return chart;
    };
    renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IAnalyticsChartsData) {
        //Remove density plot
        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`).remove();

        //Select existing circles
        let circles = chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`)
            .data(data.value);
        
        //Remove old circles
        circles.exit().remove();

        //Append new circles
        let circlesEnter = circles.enter()
            .append("circle")
            .classed("line-circle", true)
            .attr("id", `${chart.id}-timeline-circles`)
            .attr("r", 5)
            .attr("cx", (d: IReflectionAuthorEntry) => chart.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => chart.y.scale(d.point));
        
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

            _this.interactions.tooltip.appendLine(chart, 0, chart.y.scale(d.point), chart.x.scale(d.timestamp), chart.y.scale(d.point));
            _this.interactions.tooltip.appendLine(chart, chart.x.scale(d.timestamp), chart.y.scale(0), chart.x.scale(d.timestamp), chart.y.scale(d.point));
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.interactions.tooltip.removeTooltip(chart);
        }

        //Append zoom bar
        if (chart.elements.zoomSVG == undefined){
            chart.elements.zoomSVG = _this.interactions.zoom.appendZoomBar(chart);
            chart.elements.zoomFocus = chart.elements.zoomSVG.append("g")
            .attr("class", "zoom-focus");
        }

        //Select existing zoom circles
        let zoomCircle =  chart.elements.zoomSVG.selectAll(`#${chart.id}-zoom-bar-content`)
            .data(data.value);

        //Remove old zoom circles
        zoomCircle.exit().remove();

        //Append new zoom circles
        let zoomCircleEnter = zoomCircle.enter()
            .append("circle")
            .classed("zoom-circle", true)
            .attr("id", `${chart.id}-zoom-bar-content`)
            .attr("r", 2)
            .attr("cx", (d: IReflectionAuthorEntry) => zoomChart.x.scale(d.timestamp))
            .attr("cy", (d: IReflectionAuthorEntry) => zoomChart.y.scale(d.point));
        
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
                //Remove users html containers
                _this.renderTimelineDensity(chart, data);
            }
            if (selectedOption == "scatter") {
                _this.renderTimelineScatter(chart, zoomChart, data);
            }
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
    End of admin control interfaces and classess 
-------------------------------------------------- */

export function buildControlAdminAnalyticsCharts(entries: IAnalyticsChartsData[]) {
    //Handle sidebar button
    sidebarFunctions.sidebarBtn();
    drawCharts(entries);

    function drawCharts(allEntries: IAnalyticsChartsData[]) {
        let htmlContainers = new HtmlContainers();
        let adminControlCharts = new AdminControlCharts();

        //Preloaded groups
        let entries = adminControlCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = entries.map(d => new AnalyticsChartsDataStats(d));

        //Append groups chart container
        htmlContainers.groupsChart = htmlContainers.appendDiv("groups-chart", "col-md-9");
        htmlContainers.appendCard(htmlContainers.groupsChart, "Reflections box plot by group");

        //Create group chart with current data
        let groupChart = new ChartSeries("groups-chart", data.map(d => d.group));
        groupChart.elements.preRender(groupChart);
        adminControlCharts.renderGroupChart(groupChart, data);

        //Append group general statistics
        htmlContainers.groupStatistics = htmlContainers.appendDiv("groups-statistics", "col-md-3");
        let groupsStatisticsCard = htmlContainers.appendCard(htmlContainers.groupStatistics, "Statitics");
        adminControlCharts.renderGroupStats(groupsStatisticsCard, data[0]);

        //Draw groups violin container  
        htmlContainers.groupViolin = htmlContainers.appendDiv("group-violin-chart", "col-md-6 mt-3");
        htmlContainers.appendCard(htmlContainers.groupViolin, `Reflections distribution`);
        let violinChart = new ViolinChartSeries("group-violin-chart", data.map(d => d.group));
        violinChart.elements.preRender(violinChart);
        violinChart.elements.renderViolinThresholds(violinChart, [30, 70]);
        adminControlCharts.renderViolin(violinChart, data);

        //Draw users violin container
        htmlContainers.userViolin = htmlContainers.appendDiv("group-violin-users-chart", "col-md-6 mt-3");
        htmlContainers.appendCard(htmlContainers.userViolin, `Users distribution`);
        let usersData = data.map(d => {
            return d.getUsersData(d)
        });
        let violinUsersChart = new ViolinChartSeries("group-violin-users-chart", data.map(d => d.group));
        violinUsersChart.elements.preRender(violinUsersChart);
        violinUsersChart.elements.renderViolinThresholds(violinUsersChart, [30, 70]);
        adminControlCharts.renderViolin(violinUsersChart, usersData);

        //Draw selected group timeline 
        htmlContainers.groupTimeline = htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
        let timelineCard = htmlContainers.appendCard(htmlContainers.groupTimeline, `Reflections vs Time`);
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
        let timelineChart = new ChartTime("group-timeline", d3.extent(data[0].value.map(d => d.timestamp)));
        timelineChart.elements.preRender(timelineChart);
        adminControlCharts.renderTimelineDensity(timelineChart, data[0]);
        let timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(data[0].value.map(d => d.timestamp)));
        adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, data[0]);

        //Update charts depending on group
        adminControlCharts.handleGroups(groupChart, violinChart, violinUsersChart, timelineChart, timelineZoomChart, allEntries.map(d => new AnalyticsChartsDataStats(d)));
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
            entries = d3.filter(allEntries, d => selectedGroups.includes(d.group));
        };

        //Handle add or remove groups
        addRemoveGroups();
        function addRemoveGroups() {
            d3.selectAll("#groups input").on("change", (e: Event) => {
                let target = e.target as HTMLInputElement;
                if (target.checked) {
                    //Add group code to the list
                    selectedGroups.push(target.value);

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
                    selectedGroups.splice(selectedGroups.indexOf(target.value), 1);

                    //Update data
                    updateData();

                    //Remove clicks that are not in the list
                    groupChart.elements.contentContainer.selectAll(`#${groupChart.id} .content-container .click-container`)
                        .data(data)
                        .exit()
                        .remove();

                    //Handle there is an active click in the group chart
                    if (groupChart.click) {
                        //Handle if the removed code group was clicked
                        if (target.value == htmlContainer.groupStatistics.select(".card").attr("id")) {
                            //Remove click
                            chartFunctions.click.removeClick(groupChart);

                            //Remove click class
                            chartFunctions.click.removeClickClass(groupChart, "bar");

                            //Remove drilldown html containers
                            htmlContainer.remove();
                        }
                        else {
                            //Update click text
                            chartFunctions.click.appendGroupsText(groupChart, data, data[data.map(d => d.group).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))]);

                            //Update group compare inputs
                            let currentCompareGroups = groupCompare(data, htmlContainer.groupStatistics.select(".card").attr("id"));

                            //Remove removed group code from the compare groups
                            currentCompareGroups.splice(currentCompareGroups.indexOf(target.value), 1);

                            //Update violin data
                            let violinData = d3.filter(allEntries, d => currentCompareGroups.includes(d.group));

                            //Update violin chart series scale
                            violinChart.x = new ChartSeriesAxis("Group Code", violinData.map(r => r.group), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right]);

                            //Update violin users chart series scale
                            violinUsersChart.x = new ChartSeriesAxis("Group Code", violinData.map(r => r.group), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right]);

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
                entries = d3.filter(allEntries, d => selectedGroups.includes(d.group));

                //Update data with the updated entries
                data = entries.map(d => new AnalyticsChartsDataStats(d));

                //Update group chart series scale
                groupChart.x = new ChartSeriesAxis("Group Code", data.map(r => r.group), [0, groupChart.width - groupChart.padding.yAxis - groupChart.padding.right]);

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
        let data = entries.map(d => new AnalyticsChartsDataStats(d));

        //Create group chart with current data
        let groupChart = new ChartSeries("groups-chart", data.map(d => d.group));

        //Render svg, containers, standard axis and labels
        groupChart.elements.preRender(groupChart);
        renderGroupChart(groupChart, data);

        function renderGroupChart(chart: ChartSeries, data: IAnalyticsChartsDataStats[]) {
            //Select existing minMax lines
            let minMax = chart.elements.contentContainer.selectAll(`#${chart.id}-data-min-max`)
                .data(data);

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
                .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.max));

            //Merge existing and new minMax lines
            minMax.merge(minMaxEnter);

            //Select existing median lines
            let median = chart.elements.contentContainer.selectAll(`#${chart.id}-data-median`)
                .data(data);

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
                .attr("y2", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.median));

            //Merge existing and new median lines
            median.merge(medianEnter);

            //Select existing boxes
            let boxes = chart.elements.contentContainer.selectAll(`#${chart.id}-data`)
                .data(data);

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
                .attr("height", (d: IAnalyticsChartsDataStats) => chart.y.scale(d.q1) - chart.y.scale(d.q3));

            //Merge existing and new boxes
            boxes.merge(boxesEnter);

            //Transition boxes and lines
            chartFunctions.transitions.bars(chart, data);

            //Set render elements content to boxes
            chart.elements.content = chart.elements.contentContainer.selectAll(`#${chart.id}-data`);

            //Enable tooltip
            chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
            function onMouseover(e: Event, d: IAnalyticsChartsDataStats): void {
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
                    return;
                }

                //Remove existing click
                chartFunctions.click.removeClick(chart);

                //Remove existing click classes
                chartFunctions.click.removeClickClass(chart, "bar");

                //Remove HTML containers
                htmlContainer.remove();

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
            let sortButton = chart.elements.svg.select(".y-label-container").attr("class", "y-label-container zoom");
            let yArrow = chartFunctions.sort.appendArrow(sortButton, chart, false, true);
            sortButton.on("click", function () {
                chart.y.sorted = chart.y.sorted == false ? true : false;
                chartFunctions.sort.arrowTransition(chart.elements.svg, chart, yArrow, false, true);
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
            let timelineChart = new ChartTime("group-timeline", d3.extent(data.value.map(d => d.timestamp)));
            timelineChart.elements.preRender(timelineChart);
            renderTimelineDensity(timelineChart, data.value);
            let timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(data.value.map(d => d.timestamp)));

            d3.select("#group-timeline #timeline-plot").on("click", (e: any) => {
                var selectedOption = e.target.control.value;
                if (selectedOption == "density") {
                    //Remove users html containers
                    htmlContainer.removeUsers();
                    renderTimelineDensity(timelineChart, data.value);
                }
                if (selectedOption == "scatter") {
                    renderTimelineScatter(timelineChart, timelineZoomChart, data.value, data);
                }
            });

            function renderTimelineDensity(chart: ChartTime, data: IReflectionAuthorEntry[]) {
                //Remove scatter plot
                chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles`).remove();
                chart.elements.svg.selectAll(".zoom-container").remove();

                //Remove click
                chartFunctions.click.removeClick(chart);
                chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();

                //Create density data
                let densityData = createDensityData();

                function createDensityData() {
                    return d3.contourDensity<IReflectionAuthorEntry>()
                        .x(d => chart.x.scale(d.timestamp))
                        .y(d => chart.y.scale(d.point))
                        .bandwidth(5)
                        .thresholds(20)
                        .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])
                        (data);
                }

                //Draw contours
                chart.elements.content = chart.elements.contentContainer.selectAll(`${chart.id}-timeline-contours`)
                    .data(densityData)
                    .enter()
                    .append("path")
                    .attr("id", `${chart.id}-timeline-contours`)
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())
                    .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
                    .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));

                //Enable zoom
                chartFunctions.zoom.enableZoom(chart, zoomed);
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
                        .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
                        .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));

                    zoomContours.attr("d", d3.geoPath())
                        .attr("stroke", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 25))
                        .attr("fill", (d: d3.ContourMultiPolygon) => d3.interpolateBlues(d.value * 20));

                    zoomContours.merge(zoomContoursEnter);

                    chart.x.axis.ticks(newChartRange[1] / 75);
                    chart.elements.xAxis.call(chart.x.axis);
                }
            }

            function renderTimelineScatter(chart: ChartTime, zoomChart: ChartTimeZoom, data: IReflectionAuthorEntry[], stats: IAnalyticsChartsDataStats) {
                //Remove density plot
                chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-contours`).remove();

                //Draw circles
                chart.elements.content = chart.elements.contentContainer.selectAll(`${chart.id}-timeline-circles`)
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("line-circle", true)
                    .attr("id", `${chart.id}-timeline-circles`)
                    .attr("r", 5)
                    .attr("cx", (d: IReflectionAuthorEntry) => chart.x.scale(d.timestamp))
                    .attr("cy", (d: IReflectionAuthorEntry) => chart.y.scale(d.point));

                //Enable tooltip
                chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
                function onMouseover(e: Event, d: IReflectionAuthorEntry) {
                    if (d3.select(this).attr("class").includes("clicked")) {
                        return;
                    }
                    let tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, d.timestamp.toDateString(), [{ label: "State", value: d.point }]);
                    chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));

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

                    chartFunctions.tooltip.appendLine(chart, 0, chart.y.scale(d.point), chart.x.scale(d.timestamp), chart.y.scale(d.point));
                    chartFunctions.tooltip.appendLine(chart, chart.x.scale(d.timestamp), chart.y.scale(0), chart.x.scale(d.timestamp), chart.y.scale(d.point));
                }
                function onMouseout() {
                    chart.elements.svg.select(".tooltip-container").transition()
                        .style("opacity", 0);
                    chartFunctions.tooltip.removeTooltip(chart);
                }

                //Enable click
                chartFunctions.click.enableClick(chart, onClick);
                function onClick(e: Event, d: IReflectionAuthorEntry) {
                    if (d3.select(this).attr("class") == "line-circle clicked") {
                        chartFunctions.click.removeClick(chart);
                        chart.elements.content.attr("class", "line-circle");
                        chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
                        htmlContainer.removeUsers();
                        return;
                    }

                    chartFunctions.click.removeClick(chart);
                    chart.elements.contentContainer.selectAll(`#${chart.id}-timeline-circles-line`).remove();
                    //Remove users html containers
                    htmlContainer.removeUsers();
                    chart.elements.content.attr("class", (data: IReflectionAuthorEntry) => `line-circle ${data.pseudonym == d.pseudonym ? "clicked" : ""}`);
                    let userData = data.filter(c => c.pseudonym == d.pseudonym);

                    let line = d3.line<IReflectionAuthorEntry>()
                        .x(d => chart.x.scale(d.timestamp))
                        .y(d => chart.y.scale(d.point));

                    chart.elements.contentContainer.append("path")
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
                            <b>Min date: </b>${((d3.sort(userData, (r: IReflectionAuthorEntry) => r.point)[0]).timestamp).toDateString()}<br>
                            <b>Max: </b>${d3.max(userData.map(r => r.point))}<br>
                            <b>Max date: </b>${((d3.sort(userData, (r: IReflectionAuthorEntry) => r.point)[userData.length - 1]).timestamp).toDateString()}<br>
                            <b>Total: </b>${userData.length}<br>
                            <b>Std Deviation: </b>${chartFunctions.data.roundDecimal(d3.deviation(userData.map(r => r.point)))}<br>
                            <b>Variance: </b>${chartFunctions.data.roundDecimal(d3.variance(userData.map(r => r.point)))}<br>
                            <b>Oldest reflection: </b>${(d3.min(userData.map(r => r.timestamp))).toDateString()}<br>
                            <b>Newest reflection: </b>${(d3.max(userData.map(r => r.timestamp))).toDateString()}<br>`);

                    //Draw user reflections container
                    htmlContainer.reflections = htmlContainer.appendDiv("reflections-list", "col-md-9 mt-3");
                    let reflectionsCard = htmlContainer.appendCard(htmlContainer.reflections, `${d.pseudonym}'s reflections`);
                    let reflectionsCardText: string = "";
                    d3.sort(userData, r => r.timestamp).forEach(c => {
                        reflectionsCardText = reflectionsCardText + `<p><b>${c.timestamp.toDateString()} - State: ${c.point}</b><br>${c.text}</p>`
                    })
                    reflectionsCard.select(".card-body")
                        .attr("class", "card-body statistics-text")
                        .html(reflectionsCardText);

                    //Scroll
                    document.querySelector("#group-timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                //Append zoom bar
                chart.elements.zoomSVG = chartFunctions.zoom.appendZoomBar(chart);
                chart.elements.zoomFocus = chart.elements.zoomSVG.append("g")
                    .attr("class", "zoom-focus");

                //Draw in zoom bar
                chart.elements.zoomSVG.selectAll(chart.id + "zoom-bar-content")
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("zoom-line-circle", true)
                    .attr("id", chart.id + "zoom-bar-content")
                    .attr("r", 2)
                    .attr("cx", (d: IReflectionAuthorEntry) => zoomChart.x.scale(d.timestamp))
                    .attr("cy", (d: IReflectionAuthorEntry) => zoomChart.y.scale(d.point));

                //Draw hidden content that will handle the borders
                chart.elements.zoomFocus.selectAll(chart.id + "zoom-content")
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("zoom-content", true)
                    .attr("id", chart.id + "zoom-bar-content")
                    .attr("r", 2)
                    .attr("cx", (d: IReflectionAuthorEntry) => zoomChart.x.scale(d.timestamp))
                    .attr("cy", (d: IReflectionAuthorEntry) => zoomChart.y.scale(d.point));

                //Enable zoom
                chartFunctions.zoom.enableZoom(chart, zoomed);
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
            }
        }

        //Global variables for the violin chart
        let violinChart: ViolinChartSeries;
        let violinUsersChart: ViolinChartSeries;

        function groupViolinChart(data: IAnalyticsChartsData[], groups: string[]) {
            let groupData = d3.filter(data, d => groups.includes(d.group));
            let currentData = [] as IAnalyticsChartsData[];
            groupData.forEach(c => {
                let userMean = Array.from(d3.rollup(c.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
                currentData.push({ group: c.group, value: userMean });
            });

            violinChart = new ViolinChartSeries("group-violin-chart", groupData.map(d => d.group));
            violinChart.x = new ChartSeriesAxis("Group Code", groupData.map(r => r.group), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right]);
            violinChart.elements.preRender(violinChart);
            violinChart.elements.renderViolinThresholds(violinChart, [30, 70]);
            renderViolin(violinChart, groupData);

            violinUsersChart = new ViolinChartSeries("group-violin-users-chart", currentData.map(d => d.group));
            violinUsersChart.padding.right = 85;
            violinUsersChart.x = new ChartSeriesAxis("Group Code", groupData.map(r => r.group), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right]);
            violinUsersChart.elements.preRender(violinUsersChart);
            violinUsersChart.elements.renderViolinThresholds(violinUsersChart, [30, 70]);
            renderViolin(violinUsersChart, currentData);
        }

        function renderViolin(chart: ViolinChartSeries, data: IAnalyticsChartsData[]) {
            let thresholds = chart.elements.getThresholdsValues(chart);
            let tDistressed = thresholds[0];
            let tSoaring = thresholds[1];

            dragViolinThresholds(chart, data, tDistressed, tSoaring);
            drawViolin(chart, data, tDistressed, tSoaring);

            function dragViolinThresholds(chart: ViolinChartSeries, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
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
                    chartFunctions.transitions.violin(chart, data, tDistressed, newT);
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
                    chartFunctions.transitions.violin(chart, data, newT, tSoaring);
                    d3.select(this).attr("class", d3.select(this).attr("class").replace(" grabbing", ""));
                }
            }

            function drawViolin(chart: ViolinChartSeries, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
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

                //Append new bin containers
                let binContainerEnter = binContainer.enter()
                    .append("g")
                    .attr("class", `${chart.id}-violin-container`)
                    .attr("transform", (d: IAnalyticsChartsData) => `translate(${chart.x.scale(d.group)}, 0)`);

                //Draw violins
                binContainerEnter.append("path")
                    .attr("id", `${chart.id}-violin`)
                    .attr("class", "violin-path")
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
            d3.selectAll("#group-compare input").on("change", (e: Event) => {
                let target = e.target as HTMLInputElement;
                if (target.checked) {
                    currentGroups.push(target.value);
                }
                else {
                    currentGroups.splice(currentGroups.indexOf(target.value), 1);
                }

                let groupData = d3.filter(data, d => currentGroups.includes(d.group));
                let currentData = [] as IAnalyticsChartsData[];
                groupData.forEach(c => {
                    let userMean = Array.from(d3.rollup(c.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthorEntry);
                    currentData.push({ group: c.group, value: userMean });
                });

                violinChart.x = new ChartSeriesAxis("Group Code", groupData.map(r => r.group), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right]);
                violinUsersChart.x = new ChartSeriesAxis("Group Code", groupData.map(r => r.group), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right]);
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
        roundDecimal: function (value: number): string {
            let p = d3.precisionFixed(0.1);
            let f = d3.format("." + p + "f");
            return f(value);
        }
    },
    tooltip: {
        enableTooltip: function (chart: IChart, onMouseover: any, onMouseout: any) {
            this.appendTooltipContainer(chart);

            chart.elements.content.on("mouseover", onMouseover)
                .on("mouseout", onMouseout);
        },
        appendTooltipContainer: function (chart: IChart) {
            chart.elements.contentContainer.selectAll(".tooltip-container").remove();
            return chart.elements.contentContainer.append("g")
                .attr("class", "tooltip-container");
        },
        appendTooltipText: function (chart: IChart, title: string, values: ITooltipValues[] = null) {
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
        },
        appendLine: function (chart: IChart, x1: number, y1: number, x2: number, y2: number) {
            chart.elements.contentContainer.append("line")
                .attr("class", "tooltip-line")
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2);
        },
        positionTooltipContainer: function (chart: IChart, x: number, y: number) {
            chart.elements.contentContainer.select(".tooltip-container")
                .attr("transform", `translate(${x}, ${y})`)
                .transition()
                .style("opacity", 1);
        },
        removeTooltip: function (chart: IChart) {
            chart.elements.contentContainer.selectAll(".tooltip-box").remove();
            chart.elements.contentContainer.selectAll(".tooltip-text").remove();
            chart.elements.contentContainer.selectAll(".tooltip-line").remove();
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
            chart.elements.content.on("click", onClick)
        },
        removeClick: function (chart: IChart) {
            chart.click = false;
            chart.elements.contentContainer.selectAll(".click-text").remove();
            chart.elements.contentContainer.selectAll(".click-line").remove();
            chart.elements.contentContainer.selectAll(".click-container").remove();
        },
        removeClickClass: function (chart: IChart, css: string) {
            d3.selectAll(`#${chart.id} .content-container .${css}`)
                .attr("class", css)
        },
        appendText: function (chart: IChart, d: IReflectionAuthorEntry, title: string, values: ITooltipValues[] = null) {
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

            chart.elements.contentContainer.selectAll(".click-container text").remove();

            chart.elements.content.attr("class", (d: IAnalyticsChartsDataStats) => d.group == clickData.group ? "bar clicked" : "bar");

            let clickContainer = chart.elements.contentContainer.selectAll(".click-container")
                .data(data);
            clickContainer.enter()
                .append("g")
                .merge(clickContainer)
                .attr("class", "click-container")
                .attr("transform", (c: IAnalyticsChartsDataStats) => `translate(${xScale(c.group) + xScale.bandwidth() / 2}, 0)`);
            clickContainer.exit().remove();

            chart.elements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[0])
                .attr("y", (c: IAnalyticsChartsDataStats) => yScale(c.q3) - 5)
                .text((c: IAnalyticsChartsDataStats) => `q3: ${this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[1]}`);
            chart.elements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", (c: IAnalyticsChartsDataStats) => this.comparativeText(clickData.median, c.median, clickData.group, c.group)[0])
                .attr("y", (c: IAnalyticsChartsDataStats) => yScale(c.median) - 5)
                .text((c: IAnalyticsChartsDataStats) => `Median: ${this.comparativeText(clickData.median, c.median, clickData.group, c.group)[1]}`);
            chart.elements.contentContainer.selectAll(".click-container").append("text")
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
            chart.elements.svg.selectAll(".zoom-rect")
                .attr("class", "zoom-rect active");

            let zoom = d3.zoom()
                .scaleExtent([1, 5])
                .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
                .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
                .on("zoom", zoomed);

            chart.elements.contentContainer.select(".zoom-rect").call(zoom);
        },
        appendZoomBar: function (chart: IChart) {
            return chart.elements.svg.append("g")
                .attr("class", "zoom-container")
                .attr("height", 30)
                .attr("width", chart.width - chart.padding.yAxis)
                .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - 30})`);
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
        violin: function (chart: ViolinChartSeries, data: IAnalyticsChartsData[], tDistressed: number, tSoaring: number) {
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

            //Append tooltip container
            chartFunctions.tooltip.appendTooltipContainer(chart);

            //Draw threshold percentages
            chart.elements.appendThresholdPercentages(chart, bin, bandwithScale, tDistressed, tSoaring);
        }
    }
};