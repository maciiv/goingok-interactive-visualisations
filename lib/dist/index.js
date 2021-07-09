"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//Object.defineProperty(exports, "__esModule", { value: true });
//exports.buildExperimentAdminAnalyticsCharts = exports.buildControlAdminAnalyticsCharts = void 0;
//var d3 = require("d3");
var AnalyticsChartsData = /** @class */ (function () {
    function AnalyticsChartsData(group, value, selected) {
        if (selected === void 0) { selected = false; }
        this.group = group;
        this.value = value;
        this.selected = selected;
    }
    AnalyticsChartsData.prototype.getUsersData = function (data) {
        var usersMean = Array.from(d3.rollup(data.value, function (d) { return Math.round(d3.mean(d.map(function (r) { return r.point; }))); }, function (d) { return d.pseudonym; }), function (_a) {
            var pseudonym = _a[0], point = _a[1];
            return ({ pseudonym: pseudonym, point: point });
        });
        return new AnalyticsChartsData(data.group, usersMean);
    };
    return AnalyticsChartsData;
}());
var AnalyticsChartsDataStats = /** @class */ (function (_super) {
    __extends(AnalyticsChartsDataStats, _super);
    function AnalyticsChartsDataStats(entries) {
        var _this_1 = _super.call(this, entries.group, entries.value, entries.selected) || this;
        var uniqueUsers = Array.from(d3.rollup(entries.value, function (d) { return d.length; }, function (d) { return d.pseudonym; }), function (_a) {
            var key = _a[0], value = _a[1];
            return ({ key: key, value: value });
        });
        _this_1.mean = Math.round(d3.mean(entries.value.map(function (r) { return r.point; }))),
            _this_1.median = d3.median(entries.value.map(function (r) { return r.point; })),
            _this_1.q1 = d3.quantile(entries.value.map(function (r) { return r.point; }), 0.25),
            _this_1.q3 = d3.quantile(entries.value.map(function (r) { return r.point; }), 0.75),
            _this_1.max = d3.max(entries.value.map(function (r) { return r.point; })),
            _this_1.min = d3.min(entries.value.map(function (r) { return r.point; })),
            _this_1.variance = _this_1.roundDecimal(d3.variance(entries.value.map(function (r) { return r.point; }))),
            _this_1.deviation = _this_1.roundDecimal(d3.deviation(entries.value.map(function (r) { return r.point; }))),
            _this_1.oldestReflection = d3.min(entries.value.map(function (r) { return new Date(r.timestamp); })),
            _this_1.newestReflection = d3.max(entries.value.map(function (r) { return new Date(r.timestamp); })),
            _this_1.avgReflectionsPerUser = _this_1.roundDecimal(d3.mean(uniqueUsers.map(function (r) { return r.value; }))),
            _this_1.userMostReflective = d3.max(uniqueUsers.map(function (r) { return r.value; })),
            _this_1.userLessReflective = d3.min(uniqueUsers.map(function (r) { return r.value; })),
            _this_1.totalUsers = uniqueUsers.length;
        return _this_1;
    }
    ;
    AnalyticsChartsDataStats.prototype.roundDecimal = function (value) {
        var p = d3.precisionFixed(0.1);
        var f = d3.format("." + p + "f");
        return f(value);
    };
    return AnalyticsChartsDataStats;
}(AnalyticsChartsData));
// Basic class for series charts
var ChartSeries = /** @class */ (function () {
    function ChartSeries(id, domain) {
        this.id = id;
        var containerDimensions = d3.select("#" + id + " .chart-container").node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding();
        this.y = new ChartLinearAxis("State", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        this.elements = new ChartElements();
        this.click = false;
    }
    return ChartSeries;
}());
// Basic class for time series charts
var ChartTime = /** @class */ (function () {
    function ChartTime(id, domain) {
        this.id = id;
        var containerDimensions = d3.select("#" + id + " .chart-container").node().getBoundingClientRect();
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(75, 75, 5);
        this.htmlContainers = new HtmlContainers();
        this.y = new ChartLinearAxis("State", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartTimeAxis("Time", domain, [0, this.width - this.padding.yAxis]);
        this.elements = new ChartElements();
        this.click = false;
    }
    return ChartTime;
}());
// Basic class for time series zoom bar
var ChartTimeZoom = /** @class */ (function () {
    function ChartTimeZoom(chart, domain) {
        this.x = new ChartTimeAxis("", domain, [0, chart.width - chart.padding.yAxis - 5]);
        this.y = new ChartLinearAxis("", [0, 100], [25, 0], "left");
    }
    return ChartTimeZoom;
}());
// Class for violin chart series
var ViolinChartSeries = /** @class */ (function (_super) {
    __extends(ViolinChartSeries, _super);
    function ViolinChartSeries(id, domain) {
        var _this_1 = _super.call(this, id, domain) || this;
        _this_1.elements = new ViolinChartElements();
        _this_1.padding = new ChartPadding(50, 75, 25, 85);
        _this_1.x = new ChartSeriesAxis("Group Code", domain, [0, _this_1.width - _this_1.padding.yAxis - _this_1.padding.right]);
        _this_1.thresholdAxis = _this_1.y.setThresholdAxis(30, 70);
        return _this_1;
    }
    return ViolinChartSeries;
}(ChartSeries));
// Basic class for series axis scale
var ChartSeriesAxis = /** @class */ (function () {
    function ChartSeriesAxis(label, domain, range) {
        this.label = label;
        this.scale = d3.scaleBand()
            .domain(domain)
            .rangeRound(range)
            .padding(0.25);
        this.axis = d3.axisBottom(this.scale);
        this.sorted = false;
    }
    ;
    return ChartSeriesAxis;
}());
// Basic class for linear axis scale
var ChartLinearAxis = /** @class */ (function () {
    function ChartLinearAxis(label, domain, range, position) {
        this.label = label;
        this.scale = d3.scaleLinear()
            .domain([d3.min(domain), d3.max(domain)])
            .range(range);
        if (position == "right") {
            this.axis = d3.axisRight(this.scale);
        }
        else {
            this.axis = d3.axisLeft(this.scale);
        }
        var labels = new Map();
        labels.set(0, "distressed");
        labels.set(50, "going ok");
        labels.set(100, "soaring");
        this.axis.tickValues([0, 25, 50, 75, 100])
            .tickFormat(function (d, i) { return labels.get(d); });
        this.sorted = false;
    }
    ;
    ChartLinearAxis.prototype.setThresholdAxis = function (tDistressed, tSoaring) {
        return d3.axisRight(this.scale)
            .tickValues([tDistressed, tSoaring])
            .tickFormat(function (d) { return d == tDistressed ? "Distressed" : d == tSoaring ? "Soaring" : ""; });
    };
    return ChartLinearAxis;
}());
// Basic class for time axis scale
var ChartTimeAxis = /** @class */ (function () {
    function ChartTimeAxis(label, domain, range) {
        this.label = label;
        this.scale = d3.scaleTime()
            .domain(domain)
            .range(range);
        this.axis = d3.axisBottom(this.scale);
        this.sorted = false;
    }
    ;
    return ChartTimeAxis;
}());
// Basic class for chart elements (includes zoom)
var ChartElements = /** @class */ (function () {
    function ChartElements() {
    }
    ChartElements.prototype.preRender = function (chart) {
        chart.elements.svg = this.appendSVG(chart);
        chart.elements.contentContainer = this.appendContentContainer(chart);
        chart.elements.xAxis = this.appendXAxis(chart);
        this.appendXAxisLabel(chart);
        this.appendYAxis(chart);
        this.appendYAxisLabel(chart);
    };
    ChartElements.prototype.appendSVG = function (chart) {
        return d3.select("#" + chart.id)
            .select(".chart-container")
            .append("svg")
            .attr("id", "chart-" + chart.id)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + chart.width + " " + chart.height);
    };
    ;
    ChartElements.prototype.appendContentContainer = function (chart) {
        var result = chart.elements.svg.append("g")
            .attr("class", "content-container")
            .attr("transform", "translate(" + chart.padding.yAxis + ", " + chart.padding.top + ")")
            .attr("clip-path", "url(#clip-" + chart.id + ")");
        result.append("rect")
            .attr("class", "zoom-rect")
            .attr("width", chart.width - chart.padding.yAxis - chart.padding.right)
            .attr("height", chart.height - chart.padding.xAxis - chart.padding.top);
        result.append("clipPath")
            .attr("id", "clip-" + chart.id)
            .append("rect")
            .attr("x", 1)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("height", chart.height - chart.padding.xAxis - chart.padding.top);
        return result;
    };
    ;
    ChartElements.prototype.appendXAxis = function (chart) {
        return chart.elements.svg.append("g")
            .attr("transform", "translate(" + chart.padding.yAxis + ", " + (chart.height - chart.padding.xAxis) + ")")
            .attr("class", "x-axis")
            .attr("clip-path", "url(#clip-" + chart.id + ")")
            .call(chart.x.axis);
    };
    ;
    ChartElements.prototype.appendXAxisLabel = function (chart) {
        return chart.elements.svg.append("g")
            .attr("class", "x-label-container")
            .attr("transform", "translate(" + (chart.elements.svg.select(".x-axis").node().getBBox().width / 2 + chart.padding.yAxis) + ", " + (chart.height - chart.padding.xAxis + chart.elements.svg.select(".x-axis").node().getBBox().height * 2) + ")")
            .append("text")
            .attr("class", "x-label-text")
            .attr("text-anchor", "middle")
            .text(chart.x.label);
    };
    ;
    ChartElements.prototype.appendYAxis = function (chart) {
        return chart.elements.svg.append("g")
            .attr("transform", "translate(" + chart.padding.yAxis + ", " + chart.padding.top + ")")
            .attr("class", "y-axis")
            .call(chart.y.axis);
    };
    ;
    ChartElements.prototype.appendYAxisLabel = function (chart) {
        return chart.elements.svg.append("g")
            .attr("class", "y-label-container")
            .attr("transform", "translate(" + (chart.padding.yAxis - chart.elements.svg.select(".y-axis").node().getBBox().width) + ", " + (chart.padding.top + chart.elements.svg.select(".y-axis").node().getBBox().height / 2) + ") rotate(-90)")
            .append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text(chart.y.label);
    };
    return ChartElements;
}());
// Class for violin charts
var ViolinChartElements = /** @class */ (function (_super) {
    __extends(ViolinChartElements, _super);
    function ViolinChartElements() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ViolinChartElements.prototype.renderViolinThresholds = function (chart, threshold) {
        this.appendThresholdAxis(chart);
        this.appendThresholdIndicators(chart, threshold);
        this.appendThresholdLabel(chart);
        this.appendThresholdLine(chart, threshold);
    };
    ;
    ViolinChartElements.prototype.appendThresholdAxis = function (chart) {
        return chart.elements.contentContainer.append("g")
            .attr("transform", "translate(" + (chart.width - chart.padding.yAxis - chart.padding.right) + ", 0)")
            .attr("class", "threshold-axis")
            .call(chart.thresholdAxis);
    };
    ;
    ViolinChartElements.prototype.appendThresholdLabel = function (chart) {
        var label = chart.elements.svg.append("g")
            .attr("class", "threshold-label-container");
        label.append("text")
            .attr("class", "y-label-text")
            .attr("text-anchor", "middle")
            .text("Thresholds");
        label.attr("transform", "translate(" + (chart.width - chart.padding.right + chart.elements.contentContainer.select(".threshold-axis").node().getBBox().width + label.node().getBBox().height) + ", " + (chart.padding.top + chart.elements.svg.select(".y-axis").node().getBBox().height / 2) + ") rotate(-90)");
        return label;
    };
    ;
    ViolinChartElements.prototype.appendThresholdIndicators = function (chart, thresholds) {
        thresholds.forEach(function (c, i) {
            var indicator = chart.elements.contentContainer.append("g")
                .attr("class", "threshold-indicator-container " + (i == 0 ? "distressed" : "soaring"))
                .attr("transform", "translate(" + (chart.width - chart.padding.yAxis - chart.padding.right + 5) + ", " + (chart.y.scale(c) + 25) + ")");
            var box = indicator.append("rect")
                .attr("class", "threshold-indicator-box " + (i == 0 ? "distressed" : "soaring"));
            var text = indicator.append("text")
                .attr("class", "threshold-indicator-text")
                .attr("x", 5)
                .text(c);
            box.attr("width", text.node().getBBox().width + 10)
                .attr("height", text.node().getBBox().height + 5)
                .attr("y", -text.node().getBBox().height);
        });
    };
    ;
    ViolinChartElements.prototype.appendThresholdLine = function (chart, thresholds) {
        thresholds.forEach(function (c, i) {
            chart.elements.contentContainer.append("line")
                .attr("class", "threshold-line " + (i == 0 ? "distressed" : "soaring"))
                .attr("x1", 0)
                .attr("x2", chart.width - chart.padding.yAxis - chart.padding.right)
                .attr("y1", chart.y.scale(c))
                .attr("y2", chart.y.scale(c));
        });
    };
    ;
    ViolinChartElements.prototype.appendThresholdPercentages = function (chart, bin, bandwithScale, tDistressed, tSoaring) {
        var binData = function (data) {
            var bins = bin(data.map(function (r) { return r.point; }));
            var result = [];
            bins.forEach(function (c) {
                result.push({ bin: c, percentage: c.length / data.length * 100 });
            });
            return result;
        };
        var binContainer = chart.elements.contentContainer.selectAll("." + chart.id + "-violin-container");
        binContainer.selectAll("." + chart.id + "-violin-text-container").remove();
        var binTextContainer = binContainer.append("g")
            .attr("class", chart.id + "-violin-text-container");
        var binTextBox = binTextContainer.selectAll("rect")
            .data(function (d) { return binData(d.value); })
            .enter()
            .append("rect")
            .attr("class", "violin-text-box");
        var binText = binTextContainer.selectAll("text")
            .data(function (d) { return binData(d.value); })
            .enter()
            .append("text")
            .attr("class", "violin-text")
            .text(function (d) { return Math.round(d.percentage) + "%"; });
        binTextBox.attr("width", binText.node().getBBox().width + 10)
            .attr("height", binText.node().getBBox().height + 5);
        binTextBox.attr("y", function (d, i) { return positionY(i); })
            .attr("x", bandwithScale(0) - binTextBox.node().getBBox().width / 2);
        binText.attr("y", function (d, i) { return positionY(i) + binText.node().getBBox().height; })
            .attr("x", bandwithScale(0) - binText.node().getBBox().width / 2);
        function positionY(i) {
            return chart.y.scale(i == 0 ? tDistressed / 2 : i == 1 ? 50 : (100 - tSoaring) / 2 + tSoaring) - binTextBox.node().getBBox().height / 2;
        }
    };
    ;
    ViolinChartElements.prototype.getThresholdsValues = function (chart) {
        var result = [30, 70];
        var dThreshold = chart.elements.contentContainer.select(".threshold-line.distressed");
        if (dThreshold != undefined) {
            result[0] = chart.y.scale.invert(dThreshold.attr("y1"));
        }
        var sThreshold = chart.elements.contentContainer.select(".threshold-line.soaring");
        if (sThreshold != undefined) {
            result[1] = chart.y.scale.invert(sThreshold.attr("y1"));
        }
        return result;
    };
    ;
    return ViolinChartElements;
}(ChartElements));
// Basin class for chart paddinf
var ChartPadding = /** @class */ (function () {
    function ChartPadding(xAxis, yAxis, top, right) {
        this.xAxis = xAxis == undefined ? 50 : xAxis;
        this.yAxis = yAxis == undefined ? 75 : yAxis;
        this.top = top == undefined ? 25 : top;
        this.right = right == undefined ? 0 : right;
    }
    return ChartPadding;
}());
// Basic class for Html containers
var HtmlContainers = /** @class */ (function () {
    function HtmlContainers() {
    }
    HtmlContainers.prototype.remove = function () {
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
    ;
    HtmlContainers.prototype.removeUsers = function () {
        if (this.userStatistics != undefined) {
            this.userStatistics.remove();
        }
        if (this.reflections != undefined) {
            this.reflections.remove();
        }
    };
    ;
    HtmlContainers.prototype.appendDiv = function (id, css) {
        return d3.select("#analytics-charts").append("div")
            .attr("id", id)
            .attr("class", css);
    };
    ;
    HtmlContainers.prototype.appendCard = function (div, header, id) {
        var card = div.append("div")
            .attr("class", "card");
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
    ;
    return HtmlContainers;
}());
// Basic class for tooltip content interaction
var TooltipValues = /** @class */ (function () {
    function TooltipValues(label, value) {
        this.label = label == undefined ? "" : label;
        this.value = value == undefined ? 0 : value;
    }
    return TooltipValues;
}());
// Class for tooltip interaction
var Tooltip = /** @class */ (function () {
    function Tooltip() {
    }
    Tooltip.prototype.enableTooltip = function (chart, onMouseover, onMouseout) {
        this.appendTooltipContainer(chart);
        chart.elements.content.on("mouseover", onMouseover)
            .on("mouseout", onMouseout);
    };
    ;
    Tooltip.prototype.removeTooltip = function (chart) {
        chart.elements.contentContainer.selectAll(".tooltip-box").remove();
        chart.elements.contentContainer.selectAll(".tooltip-text").remove();
        chart.elements.contentContainer.selectAll(".tooltip-line").remove();
    };
    ;
    Tooltip.prototype.appendTooltipContainer = function (chart) {
        chart.elements.contentContainer.selectAll(".tooltip-container").remove();
        return chart.elements.contentContainer.append("g")
            .attr("class", "tooltip-container");
    };
    ;
    Tooltip.prototype.appendTooltipText = function (chart, title, values) {
        if (values === void 0) { values = null; }
        var result = chart.elements.contentContainer.select(".tooltip-container").append("rect")
            .attr("class", "tooltip-box");
        var text = chart.elements.contentContainer.select(".tooltip-container").append("text")
            .attr("class", "tooltip-text title")
            .attr("x", 10)
            .text(title);
        var textSize = text.node().getBBox().height;
        text.attr("y", textSize);
        if (values != null) {
            values.forEach(function (c, i) {
                text.append("tspan")
                    .attr("class", "tooltip-text")
                    .attr("y", textSize * (i + 2))
                    .attr("x", 15)
                    .text(c.label + ": " + c.value);
            });
        }
        chart.elements.contentContainer.select(".tooltip-box").attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5);
        return result;
    };
    ;
    Tooltip.prototype.positionTooltipContainer = function (chart, x, y) {
        chart.elements.contentContainer.select(".tooltip-container")
            .attr("transform", "translate(" + x + ", " + y + ")")
            .transition()
            .style("opacity", 1);
    };
    ;
    Tooltip.prototype.appendLine = function (chart, x1, y1, x2, y2) {
        chart.elements.contentContainer.append("line")
            .attr("class", "tooltip-line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    };
    ;
    return Tooltip;
}());
// Class for zoom interaction
var Zoom = /** @class */ (function () {
    function Zoom() {
    }
    Zoom.prototype.enableZoom = function (chart, zoomed) {
        chart.elements.svg.selectAll(".zoom-rect")
            .attr("class", "zoom-rect active");
        var zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .on("zoom", zoomed);
        chart.elements.contentContainer.select(".zoom-rect").call(zoom);
    };
    ;
    Zoom.prototype.appendZoomBar = function (chart) {
        return chart.elements.svg.append("g")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("transform", "translate(" + chart.padding.yAxis + ", " + (chart.height - 30) + ")");
    };
    ;
    return Zoom;
}());
// Class for click interaction
var Click = /** @class */ (function () {
    function Click() {
    }
    Click.prototype.enableClick = function (chart, onClick) {
        chart.elements.content.on("click", onClick);
    };
    ;
    Click.prototype.removeClick = function (chart) {
        chart.click = false;
        chart.elements.contentContainer.selectAll(".click-text").remove();
        chart.elements.contentContainer.selectAll(".click-line").remove();
        chart.elements.contentContainer.selectAll(".click-container").remove();
    };
    ;
    Click.prototype.removeClickClass = function (chart, css) {
        d3.selectAll("#" + chart.id + " .content-container ." + css)
            .attr("class", css);
    };
    ;
    Click.prototype.appendScatterText = function (chart, d, title, values) {
        if (values === void 0) { values = null; }
        var container = chart.elements.contentContainer.append("g")
            .datum(d)
            .attr("class", "click-container");
        var box = container.append("rect")
            .attr("class", "click-box");
        var text = container.append("text")
            .attr("class", "click-text title")
            .attr("x", 10)
            .text(title);
        var textSize = text.node().getBBox().height;
        text.attr("y", textSize);
        if (values != null) {
            values.forEach(function (c, i) {
                text.append("tspan")
                    .attr("class", "click-text")
                    .attr("y", textSize * (i + 2))
                    .attr("x", 15)
                    .text(c.label + ": " + c.value);
            });
        }
        box.attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5)
            .attr("clip-path", "url(#clip-" + chart.id + ")");
        container.attr("transform", this.positionClickContainer(chart, box, text, d));
    };
    ;
    Click.prototype.positionClickContainer = function (chart, box, text, d) {
        var positionX = chart.x.scale(d.timestamp);
        var positionY = chart.y.scale(d.point) - box.node().getBBox().height - 10;
        if (chart.width - chart.padding.yAxis < chart.x.scale(d.timestamp) + text.node().getBBox().width) {
            positionX = chart.x.scale(d.timestamp) - box.node().getBBox().width;
        }
        ;
        if (chart.y.scale(d.point) - box.node().getBBox().height - 10 < 0) {
            positionY = positionY + box.node().getBBox().height + 20;
        }
        ;
        return "translate(" + positionX + ", " + positionY + ")";
    };
    ;
    Click.prototype.appendGroupsText = function (chart, data, clickData) {
        var _this_1 = this;
        chart.elements.contentContainer.selectAll(".click-container text").remove();
        chart.elements.content.attr("class", function (d) { return d.group == clickData.group ? "bar clicked" : "bar"; });
        var clickContainer = chart.elements.contentContainer.selectAll(".click-container")
            .data(data);
        clickContainer.enter()
            .append("g")
            .merge(clickContainer)
            .attr("class", "click-container")
            .attr("transform", function (c) { return "translate(" + (chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2) + ", 0)"; });
        clickContainer.exit().remove();
        chart.elements.contentContainer.selectAll(".click-container").append("text")
            .attr("class", function (c) { return _this_1.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[0]; })
            .attr("y", function (c) { return chart.y.scale(c.q3) - 5; })
            .text(function (c) { return "q3: " + _this_1.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[1]; });
        chart.elements.contentContainer.selectAll(".click-container").append("text")
            .attr("class", function (c) { return _this_1.comparativeText(clickData.median, c.median, clickData.group, c.group)[0]; })
            .attr("y", function (c) { return chart.y.scale(c.median) - 5; })
            .text(function (c) { return "Median: " + _this_1.comparativeText(clickData.median, c.median, clickData.group, c.group)[1]; });
        chart.elements.contentContainer.selectAll(".click-container").append("text")
            .attr("class", function (c) { return _this_1.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[0]; })
            .attr("y", function (c) { return chart.y.scale(c.q1) - 5; })
            .text(function (c) { return "q1: " + _this_1.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[1]; });
    };
    ;
    Click.prototype.comparativeText = function (clickValue, value, clickXValue, xValue) {
        var textClass = "click-text";
        var textSymbol = "";
        if (clickValue - value < 0) {
            textClass = textClass + " positive";
            textSymbol = "+";
        }
        else if (clickValue - value > 0) {
            textClass = textClass + " negative";
            textSymbol = "-";
        }
        else {
            textClass = textClass + " black";
        }
        return [textClass, "" + textSymbol + (clickXValue == xValue ? clickValue : (Math.abs(clickValue - value)))];
    };
    return Click;
}());
// Class for sort interaction
var Sort = /** @class */ (function () {
    function Sort() {
    }
    Sort.prototype.appendArrow = function (chart, x, y) {
        if (x === void 0) { x = false; }
        if (y === void 0) { y = false; }
        var selector = x == true ? ".x-label-container" : ".y-label-container";
        var button = d3.select(selector).attr("class", "y-label-container sort");
        button.append("polygon")
            .attr("class", "sort-arrow")
            .attr("points", this.arrowPoints(chart, x, y));
        return button;
    };
    ;
    Sort.prototype.arrowPoints = function (chart, x, y) {
        var selector = x == true ? ".x-label-text" : ".y-label-text";
        var height = chart.elements.svg.select(selector).node().getBBox().height;
        var width = chart.elements.svg.select(selector).node().getBBox().width;
        var point1 = [(width / 2) + 5, 0];
        var point2 = [(width / 2) + 5, -height / 2];
        var point3 = [(width / 2) + 15, -height / 4];
        if ((x == true && chart.x.sorted == false) || (y == true && chart.y.sorted == false)) {
            point1 = [-(width / 2) - 5, 0];
            point2 = [-(width / 2) - 5, -height / 2];
            point3 = [-(width / 2) - 15, -height / 4];
        }
        return point1 + ", " + point2 + ", " + point3;
    };
    ;
    Sort.prototype.setSorted = function (chart, x, y) {
        if (x === void 0) { x = false; }
        if (y === void 0) { y = false; }
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
    ;
    Sort.prototype.arrowTransition = function (chart, x, y) {
        if (x === void 0) { x = false; }
        if (y === void 0) { y = false; }
        var selector = x == true ? ".x-label-container" : ".y-label-container";
        if (chart.elements.svg.select(selector + " .sort-arrow.active").empty()) {
            chart.elements.svg.select(selector + " .sort-arrow")
                .transition()
                .attr("points", this.arrowPoints(chart, x, y))
                .attr("class", "sort-arrow active");
        }
        else {
            chart.elements.svg.select(selector + " .sort-arrow.active")
                .attr("class", "sort-arrow")
                .transition()
                .attr("points", this.arrowPoints(chart, x, y))
                .attr("class", "sort-arrow active");
        }
    };
    ;
    Sort.prototype.sortData = function (a, b, sorted) {
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
    };
    ;
    return Sort;
}());
var AdminControlCharts = /** @class */ (function () {
    function AdminControlCharts() {
        this.htmlContainers = new HtmlContainers();
        this.interactions = new AdminControlInteractions();
    }
    AdminControlCharts.prototype.sidebarBtn = function () {
        var sidebarWidth = d3.select("#sidebar").node().getBoundingClientRect().width;
        d3.select("#sidebar")
            .style("width", sidebarWidth + "px");
        //Handle side bar btn click
        d3.select("#sidebar-btn").on("click", function (e) {
            var isActive = d3.select("#sidebar").attr("class") == "active";
            d3.select("#sidebar")
                .attr("class", isActive ? "" : "active")
                .style("margin-left", isActive ? 66 - sidebarWidth + "px" : "");
            d3.select("#sidebar #groups")
                .style("opacity", isActive ? "0" : "1");
        });
    };
    ;
    AdminControlCharts.prototype.preloadGroups = function (allEntries) {
        d3.selectAll("#groups input").each(function () {
            var _this_1 = this;
            d3.select(this).attr("checked") == null ? "" : allEntries.find(function (d) { return d.group == d3.select(_this_1).attr("value"); }).selected = true;
        });
        return d3.filter(allEntries, function (d) { return d.selected == true; });
    };
    ;
    AdminControlCharts.prototype.renderGroupChart = function (chart, data) {
        //Select existing minMax lines
        var minMax = chart.elements.contentContainer.selectAll("#" + chart.id + "-data-min-max")
            .data(data);
        //Remove old minMax lines
        minMax.exit().remove();
        //Append new minMax lines
        var minMaxEnter = minMax.enter()
            .append("line")
            .attr("id", chart.id + "-data-min-max")
            .attr("class", "box-line")
            .attr("x1", function (d) { return chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2); })
            .attr("x2", function (d) { return chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2); })
            .attr("y1", function (d) { return chart.y.scale(d.min); })
            .attr("y2", function (d) { return chart.y.scale(d.max); });
        //Merge existing and new minMax lines
        minMax.merge(minMaxEnter);
        //Select existing median lines
        var median = chart.elements.contentContainer.selectAll("#" + chart.id + "-data-median")
            .data(data);
        //Remove old median lines
        median.exit().remove();
        //Append new median lines
        var medianEnter = median.enter()
            .append("line")
            .attr("id", chart.id + "-data-median")
            .attr("class", "box-line")
            .attr("x1", function (d) { return chart.x.scale(d.group); })
            .attr("x2", function (d) { return chart.x.scale(d.group) + chart.x.scale.bandwidth(); })
            .attr("y1", function (d) { return chart.y.scale(d.median); })
            .attr("y2", function (d) { return chart.y.scale(d.median); });
        //Merge existing and new median lines
        median.merge(medianEnter);
        //Select existing boxes
        var boxes = chart.elements.contentContainer.selectAll("#" + chart.id + "-data")
            .data(data);
        //Remove old boxes
        boxes.exit().remove();
        //Append new boxes
        var boxesEnter = boxes.enter()
            .append("rect")
            .attr("id", chart.id + "-data")
            .classed("bar", true)
            .attr("y", function (d) { return chart.y.scale(d.q3); })
            .attr("x", function (d) { return chart.x.scale(d.group); })
            .attr("width", function (d) { return chart.x.scale.bandwidth(); })
            .attr("height", function (d) { return chart.y.scale(d.q1) - chart.y.scale(d.q3); });
        //Merge existing and new boxes
        boxes.merge(boxesEnter);
        //Transition boxes and lines
        var _this = this;
        _this.interactions.bars(chart, data);
        //Set render elements content to boxes
        chart.elements.content = chart.elements.contentContainer.selectAll("#" + chart.id + "-data");
        //Enable tooltip
        this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e, d) {
            //If box is clicked not append tooltip
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            //Append tooltip box with text
            var tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.group, [new TooltipValues("q1", d.q1),
                new TooltipValues("q3", d.q3),
                new TooltipValues("Median", d.median),
                new TooltipValues("Mean", d.mean),
                new TooltipValues("Max", d.max),
                new TooltipValues("Min", d.min)]);
            //Position tooltip container
            _this.interactions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.q3, tooltipBox));
            function xTooltip(x, tooltipBox) {
                //Position tooltip right of the box
                var xTooltip = chart.x.scale(x) + chart.x.scale.bandwidth();
                //If tooltip does not fit position left of the box
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - chart.x.scale.bandwidth() - tooltipBox.node().getBBox().width;
                }
                return xTooltip;
            }
            function yTooltip(y, tooltipBox) {
                //Position tooltip on top of the box
                var yTooltip = chart.y.scale(y) - (tooltipBox.node().getBBox().height / 2);
                //If tooltip does not fit position at the same height as the box
                if (chart.y.scale.invert(yTooltip) < 0) {
                    return chart.y.scale(y + chart.y.scale.invert(yTooltip));
                }
                return yTooltip;
            }
        }
        function onMouseout() {
            //Transition tooltip to opacity 0
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            //Remove tooltip
            _this.interactions.tooltip.removeTooltip(chart);
        }
        return chart;
    };
    AdminControlCharts.prototype.renderGroupStats = function (div, data) {
        div.select(".card-body").html("");
        return div.select(".card-body")
            .attr("class", "card-body statistics-text")
            .html("<b>Q1: </b>" + data.q1 + "<br>\n                        <b>Median: </b>" + data.median + "<br>\n                        <b>Q3: </b>" + data.q3 + "<br>\n                        <b>Mean: </b>" + data.mean + "<br>\n                        <b>Total Reflections: </b>" + data.value.length + "<br>\n                        <b>Variance: </b>" + data.variance + "<br>\n                        <b>Std Deviation: </b>" + data.deviation + "<br>\n                        <b>Max: </b>" + data.max + "<br>\n                        <b>Min: </b>" + data.min + "<br>\n                        <b>Reflections per user: </b>" + data.avgReflectionsPerUser + "<br>\n                        <b>Max reflections per user: </b>" + data.userMostReflective + "<br>\n                        <b>Min reflections per user: </b>" + data.userLessReflective + "<br>\n                        <b>Total Users: </b>" + data.totalUsers + "<br>\n                        <b>Oldest reflection</b><br>" + data.oldestReflection.toDateString() + "<br>\n                        <b>Newest reflection</b><br>" + data.newestReflection.toDateString() + "<br>");
    };
    ;
    AdminControlCharts.prototype.renderViolin = function (chart, data) {
        var _this = this;
        var thresholds = chart.elements.getThresholdsValues(chart);
        var tDistressed = thresholds[0];
        var tSoaring = thresholds[1];
        //Create bandwidth scale
        var bandwithScale = d3.scaleLinear()
            .range([0, chart.x.scale.bandwidth()])
            .domain([-d3.max(data.map(function (r) { return r.value.length; })), d3.max(data.map(function (r) { return r.value.length; }))]);
        //Create bins             
        var bin = d3.bin().domain([0, 100]).thresholds([0, tDistressed, tSoaring]);
        //Select existing bin containers
        var binContainer = chart.elements.contentContainer.selectAll("." + chart.id + "-violin-container")
            .data(data);
        //Remove old bin containers
        binContainer.exit().remove();
        //Append new bin containers
        var binContainerEnter = binContainer.enter()
            .append("g")
            .attr("class", chart.id + "-violin-container")
            .attr("transform", function (d) { return "translate(" + chart.x.scale(d.group) + ", 0)"; });
        //Draw violins
        binContainerEnter.append("path")
            .attr("id", chart.id + "-violin")
            .attr("class", "violin-path")
            .datum(function (d) { return bin(d.value.map(function (d) { return d.point; })); })
            .attr("d", d3.area()
            .x0(function (d) { return bandwithScale(-d.length); })
            .x1(function (d) { return bandwithScale(d.length); })
            .y(function (d, i) { return chart.y.scale(i == 0 ? 0 : i == 1 ? 50 : 100); })
            .curve(d3.curveCatmullRom));
        //Transision bin containers
        binContainer.transition()
            .duration(750)
            .attr("transform", function (d) { return "translate(" + chart.x.scale(d.group) + ", 0)"; });
        //Merge existing with new bin containers
        binContainer.merge(binContainerEnter);
        //Transition violins
        this.interactions.violin(chart, data, tDistressed, tSoaring);
        //Append tooltip container
        this.interactions.tooltip.appendTooltipContainer(chart);
        chart.elements.contentContainer.selectAll(".violin-text")
            .on("mouseover", onMouseover)
            .on("mouseout", onMouseout);
        function onMouseover(e, d) {
            _this.interactions.tooltip.appendTooltipText(chart, "Count: " + d.bin.length.toString());
            _this.interactions.tooltip.positionTooltipContainer(chart, bandwithScale(0), parseInt(d3.select(this).attr("y")) - d3.selectAll(".violin-text-box").node().getBBox().height);
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            _this.interactions.tooltip.removeTooltip(chart);
        }
        return chart;
    };
    ;
    AdminControlCharts.prototype.renderTimelineDensity = function (chart, data) {
        //Remove scatter plot
        chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles").remove();
        chart.elements.svg.selectAll(".zoom-container").remove();
        chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line").remove();
        chart.elements.zoomSVG = undefined;
        chart.elements.zoomFocus = undefined;
        //Create density data
        function createDensityData() {
            return d3.contourDensity()
                .x(function (d) { return chart.x.scale(d.timestamp); })
                .y(function (d) { return chart.y.scale(d.point); })
                .bandwidth(5)
                .thresholds(20)
                .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])(data.value);
        }
        //Draw contours
        chart.elements.content = chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-contours")
            .data(createDensityData())
            .enter()
            .append("path")
            .attr("id", chart.id + "-timeline-contours")
            .attr("class", "contour")
            .attr("d", d3.geoPath())
            .attr("stroke", function (d) { return d3.interpolateBlues(d.value * 25); })
            .attr("fill", function (d) { return d3.interpolateBlues(d.value * 20); });
        //Enable zoom
        this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e) {
            var newChartRange = [0, chart.width - chart.padding.yAxis].map(function (d) { return e.transform.applyX(d); });
            chart.x.scale.rangeRound(newChartRange);
            var newDensityData = createDensityData();
            var zoomContours = chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-contours")
                .data(newDensityData);
            zoomContours.exit().remove();
            var zoomContoursEnter = zoomContours.enter()
                .append("path")
                .attr("id", chart.id + "-timeline-contours")
                .attr("class", "contour")
                .attr("d", d3.geoPath())
                .attr("stroke", function (d) { return d3.interpolateBlues(d.value * 25); })
                .attr("fill", function (d) { return d3.interpolateBlues(d.value * 20); });
            zoomContours.attr("d", d3.geoPath())
                .attr("stroke", function (d) { return d3.interpolateBlues(d.value * 25); })
                .attr("fill", function (d) { return d3.interpolateBlues(d.value * 20); });
            zoomContours.merge(zoomContoursEnter);
            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
        }
        return chart;
    };
    ;
    AdminControlCharts.prototype.renderTimelineScatter = function (chart, zoomChart, data) {
        //Remove density plot
        chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-contours").remove();
        //Select existing circles
        var circles = chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles")
            .data(data.value);
        //Remove old circles
        circles.exit().remove();
        //Append new circles
        var circlesEnter = circles.enter()
            .append("circle")
            .classed("line-circle", true)
            .attr("id", chart.id + "-timeline-circles")
            .attr("r", 5)
            .attr("cx", function (d) { return chart.x.scale(d.timestamp); })
            .attr("cy", function (d) { return chart.y.scale(d.point); });
        //Merge existing and new circles
        circles.merge(circlesEnter);
        var _this = this;
        _this.interactions.circles(chart, data);
        //Set render elements content to circles
        chart.elements.content = chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles");
        //Enable tooltip       
        _this.interactions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e, d) {
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            var tooltipBox = _this.interactions.tooltip.appendTooltipText(chart, d.timestamp.toDateString(), [{ label: "State", value: d.point }]);
            _this.interactions.tooltip.positionTooltipContainer(chart, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));
            function xTooltip(x, tooltipBox) {
                var xTooltip = chart.x.scale(x);
                if (chart.width - chart.padding.yAxis < xTooltip + tooltipBox.node().getBBox().width) {
                    return xTooltip - tooltipBox.node().getBBox().width;
                }
                return xTooltip;
            }
            ;
            function yTooltip(y, tooltipBox) {
                var yTooltip = chart.y.scale(y) - tooltipBox.node().getBBox().height - 10;
                if (yTooltip < 0) {
                    return yTooltip + tooltipBox.node().getBBox().height + 20;
                }
                return yTooltip;
            }
            ;
            _this.interactions.tooltip.appendLine(chart, 0, chart.y.scale(d.point), chart.x.scale(d.timestamp), chart.y.scale(d.point));
            _this.interactions.tooltip.appendLine(chart, chart.x.scale(d.timestamp), chart.y.scale(0), chart.x.scale(d.timestamp), chart.y.scale(d.point));
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
        var zoomCircle = chart.elements.zoomSVG.selectAll("#" + chart.id + "-zoom-bar-content")
            .data(data.value);
        //Remove old zoom circles
        zoomCircle.exit().remove();
        //Append new zoom circles
        var zoomCircleEnter = zoomCircle.enter()
            .append("circle")
            .classed("zoom-circle", true)
            .attr("id", chart.id + "-zoom-bar-content")
            .attr("r", 2)
            .attr("cx", function (d) { return zoomChart.x.scale(d.timestamp); })
            .attr("cy", function (d) { return zoomChart.y.scale(d.point); });
        //Merge existing and new zoom circles
        zoomCircle.merge(zoomCircleEnter);
        _this.interactions.circlesZoom(chart, zoomChart, data);
        var zoomCircleContent = chart.elements.zoomFocus.selectAll("#" + chart.id + "-zoom-content")
            .data(data.value);
        zoomCircleContent.exit().remove();
        var zoomCircleContentEnter = zoomCircleContent.enter()
            .append("circle")
            .classed("zoom-content", true)
            .attr("id", chart.id + "-zoom-content")
            .attr("r", 2)
            .attr("cx", function (d) { return zoomChart.x.scale(d.timestamp); })
            .attr("cy", function (d) { return zoomChart.y.scale(d.point); });
        zoomCircleContent.merge(zoomCircleContentEnter);
        //Enable zoom
        _this.interactions.zoom.enableZoom(chart, zoomed);
        function zoomed(e) {
            var newChartRange = [0, chart.width - chart.padding.yAxis].map(function (d) { return e.transform.applyX(d); });
            chart.x.scale.rangeRound(newChartRange);
            zoomChart.x.scale.rangeRound([0, chart.width - chart.padding.yAxis - 5].map(function (d) { return e.transform.invertX(d); }));
            var newLine = d3.line()
                .x(function (d) { return chart.x.scale(d.timestamp); })
                .y(function (d) { return chart.y.scale(d.point); });
            chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles")
                .attr("cx", function (d) { return chart.x.scale(d.timestamp); });
            chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line")
                .attr("d", function (d) { return newLine(d); });
            chart.elements.contentContainer.selectAll(".click-container")
                .attr("transform", function (d) { return "translate(" + chart.x.scale(d.timestamp) + ", " + chart.y.scale(d.point) + ")"; });
            chart.elements.zoomFocus.selectAll(".zoom-content")
                .attr("cx", function (d) { return zoomChart.x.scale(d.timestamp); });
            chart.x.axis.ticks(newChartRange[1] / 75);
            chart.elements.xAxis.call(chart.x.axis);
        }
        return chart;
    };
    ;
    AdminControlCharts.prototype.handleTimelineButtons = function (chart, zoomChart, data) {
        var _this = this;
        d3.select("#group-timeline #timeline-plot").on("click", function (e) {
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
    ;
    return AdminControlCharts;
}());
var AdminControlTransitions = /** @class */ (function () {
    function AdminControlTransitions() {
    }
    AdminControlTransitions.prototype.axisSeries = function (chart, data) {
        chart.x.scale.domain(data.map(function (d) { return d.group; }));
        d3.select("#" + chart.id + " .x-axis").transition()
            .duration(750)
            .call(chart.x.axis);
    };
    ;
    AdminControlTransitions.prototype.axisTime = function (chart, data) {
        chart.x.scale.domain(d3.extent(data.value.map(function (d) { return d.timestamp; })));
        d3.select("#" + chart.id + " .x-axis").transition()
            .duration(750)
            .call(chart.x.axis);
    };
    ;
    AdminControlTransitions.prototype.bars = function (chart, data) {
        d3.selectAll("#" + chart.id + " .content-container #" + chart.id + "-data")
            .data(data)
            .transition()
            .duration(750)
            .attr("width", function (d) { return chart.x.scale.bandwidth(); })
            .attr("height", function (d) { return chart.y.scale(d.q1) - chart.y.scale(d.q3); })
            .attr("y", function (d) { return chart.y.scale(d.q3); })
            .attr("x", function (d) { return chart.x.scale(d.group); });
        d3.selectAll("#" + chart.id + " #" + chart.id + "-data-min-max")
            .data(data)
            .transition()
            .duration(750)
            .attr("x1", function (d) { return chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2); })
            .attr("y1", function (d) { return chart.y.scale(d.min); })
            .attr("x2", function (d) { return chart.x.scale(d.group) + (chart.x.scale.bandwidth() / 2); })
            .attr("y2", function (d) { return chart.y.scale(d.max); });
        d3.selectAll("#" + chart.id + " #" + chart.id + "-data-median")
            .data(data)
            .transition()
            .duration(750)
            .attr("x1", function (d) { return chart.x.scale(d.group); })
            .attr("y1", function (d) { return chart.y.scale(d.median); })
            .attr("x2", function (d) { return chart.x.scale(d.group) + chart.x.scale.bandwidth(); })
            .attr("y2", function (d) { return chart.y.scale(d.median); });
    };
    ;
    AdminControlTransitions.prototype.circles = function (chart, data) {
        chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles")
            .data(data.value)
            .transition()
            .duration(750)
            .attr("r", 5)
            .attr("cx", function (d) { return chart.x.scale(d.timestamp); })
            .attr("cy", function (d) { return chart.y.scale(d.point); });
    };
    ;
    AdminControlTransitions.prototype.circlesZoom = function (chart, chartZoom, data) {
        chart.elements.zoomSVG.selectAll("#" + chart.id + "-zoom-bar-content")
            .data(data.value)
            .transition()
            .duration(750)
            .attr("r", 2)
            .attr("cx", function (d) { return chartZoom.x.scale(d.timestamp); })
            .attr("cy", function (d) { return chartZoom.y.scale(d.point); });
    };
    ;
    AdminControlTransitions.prototype.violin = function (chart, data, tDistressed, tSoaring) {
        //Create bandwidth scale
        var bandwithScale = d3.scaleLinear()
            .range([0, chart.x.scale.bandwidth()])
            .domain([-d3.max(data.map(function (r) { return r.value.length; })), d3.max(data.map(function (r) { return r.value.length; }))]);
        //Create bins             
        var bin = d3.bin().domain([0, 100]).thresholds([0, tDistressed, tSoaring]);
        //Draw violins
        chart.elements.contentContainer.selectAll("." + chart.id + "-violin-container").select("path")
            .datum(function (d) { return bin(d.value.map(function (d) { return d.point; })); })
            .transition()
            .duration(750)
            .attr("d", d3.area()
            .x0(function (d) { return bandwithScale(-d.length); })
            .x1(function (d) { return bandwithScale(d.length); })
            .y(function (d, i) { return chart.y.scale(i == 0 ? 0 : i == 1 ? 50 : 100); })
            .curve(d3.curveCatmullRom));
        //Draw threshold percentages
        chart.elements.appendThresholdPercentages(chart, bin, bandwithScale, tDistressed, tSoaring);
    };
    ;
    AdminControlTransitions.prototype.density = function (chart, data) {
        chart.elements.contentContainer.selectAll(chart.id + "-timeline-contours")
            .data(data)
            .transition()
            .duration(750)
            .attr("d", d3.geoPath())
            .attr("stroke", function (d) { return d3.interpolateBlues(d.value * 25); })
            .attr("fill", function (d) { return d3.interpolateBlues(d.value * 20); });
    };
    ;
    return AdminControlTransitions;
}());
var AdminControlInteractions = /** @class */ (function (_super) {
    __extends(AdminControlInteractions, _super);
    function AdminControlInteractions() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.tooltip = new Tooltip();
        _this_1.zoom = new Zoom();
        return _this_1;
    }
    return AdminControlInteractions;
}(AdminControlTransitions));
var AdminExperimentalCharts = /** @class */ (function (_super) {
    __extends(AdminExperimentalCharts, _super);
    function AdminExperimentalCharts() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.interactions = new AdminExperimentalInteractions();
        return _this_1;
    }
    AdminExperimentalCharts.prototype.handleGroups = function (boxPlot, allEntries) {
        var _this = this;
        function updateData(chart, allEntries) {
            var entries = d3.filter(allEntries, function (d) { return d.selected; });
            var data = entries.map(function (d) { return new AnalyticsChartsDataStats(d); });
            chart.x = new ChartSeriesAxis("Group Code", data.map(function (r) { return r.group; }), [0, chart.width - chart.padding.yAxis - chart.padding.right]);
            return data;
        }
        ;
        function updateGroupChart(chart, data) {
            _this.interactions.axisSeries(chart, data);
            _this.renderGroupChart(chart, data);
        }
        d3.selectAll("#groups input").on("change", function (e) {
            var target = e.target;
            if (target.checked) {
                allEntries.find(function (d) { return d.group == target.value; }).selected = true;
                var data = updateData(boxPlot, allEntries);
                updateGroupChart(boxPlot, data);
                if (boxPlot.click) {
                    _this.interactions.click.appendGroupsText(boxPlot, data, data[data.map(function (d) { return d.group; }).indexOf(d3.select("#groups-statistics .card").attr("id"))]);
                    var violinData = _this.getGroupCompareData(data, d3.select("#groups-statistics .card").attr("id"));
                    _this.renderGroupCompare(data, d3.select("#groups-statistics .card").attr("id"));
                    _this.handleGroupCompare(data, violinData);
                }
            }
            else {
                allEntries.find(function (d) { return d.group == target.value; }).selected = false;
                var data = updateData(boxPlot, allEntries);
                updateGroupChart(boxPlot, data);
                boxPlot.elements.contentContainer.selectAll("#" + boxPlot.id + " .content-container .click-container")
                    .data(data)
                    .exit()
                    .remove();
                if (boxPlot.click) {
                    if (target.value == d3.select("#groups-statistics .card").attr("id")) {
                        _this.interactions.click.removeClick(boxPlot);
                        _this.interactions.click.removeClickClass(boxPlot, "bar");
                        _this.htmlContainers.remove();
                    }
                    else {
                        _this.interactions.click.appendGroupsText(boxPlot, data, data[data.map(function (d) { return d.group; }).indexOf(d3.select("#groups-statistics .card").attr("id"))]);
                        var violinData = _this.getGroupCompareData(data, d3.select("#groups-statistics .card").attr("id"));
                        _this.renderGroupCompare(data, d3.select("#groups-statistics .card").attr("id"));
                        _this.violin.x = new ChartSeriesAxis("Group Code", violinData.map(function (r) { return r.group; }), [0, _this.violin.width - _this.violin.padding.yAxis - _this.violin.padding.right]);
                        _this.usersViolin.x = new ChartSeriesAxis("Group Code", violinData.map(function (r) { return r.group; }), [0, _this.usersViolin.width - _this.usersViolin.padding.yAxis - _this.usersViolin.padding.right]);
                        _this.handleGroupCompare(data, violinData);
                        _this.renderViolin(_this.violin, violinData);
                        _this.renderViolin(_this.usersViolin, violinData);
                        _this.interactions.axisSeries(_this.violin, violinData);
                        _this.interactions.axisSeries(_this.usersViolin, violinData);
                    }
                }
            }
        });
    };
    ;
    AdminExperimentalCharts.prototype.renderGroupChart = function (chart, data) {
        chart = _super.prototype.renderGroupChart.call(this, chart, data);
        var _this = this;
        _this.interactions.click.enableClick(chart, onClick);
        function onClick(e, d) {
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
            var groupsStatisticsCard = _this.htmlContainers.appendCard(_this.htmlContainers.groupStatistics, "Statitics (" + d.group + ")", d.group);
            _this.renderGroupStats(groupsStatisticsCard, d);
            //Draw compare
            _this.htmlContainers.compare = _this.htmlContainers.appendDiv("group-compare", "col-md-2 mt-3");
            var compareCard = _this.htmlContainers.appendCard(_this.htmlContainers.compare, "Compare " + d.group + " with:");
            compareCard.select(".card-body").attr("class", "card-body");
            var violinData = _this.getGroupCompareData(data, d3.select("#groups-statistics .card").attr("id"));
            _this.renderGroupCompare(data, d.group);
            //Draw groups violin container  
            _this.htmlContainers.groupViolin = _this.htmlContainers.appendDiv("group-violin-chart", "col-md-5 mt-3");
            _this.htmlContainers.appendCard(_this.htmlContainers.groupViolin, "Reflections distribution (" + d.group + ")");
            _this.violin = new ViolinChartSeries("group-violin-chart", violinData.map(function (d) { return d.group; }));
            _this.violin.elements.preRender(_this.violin);
            _this.violin.elements.renderViolinThresholds(_this.violin, [30, 70]);
            _this.violin = _this.renderViolin(_this.violin, violinData);
            //Draw users violin container
            _this.htmlContainers.userViolin = _this.htmlContainers.appendDiv("group-violin-users-chart", "col-md-5 mt-3");
            _this.htmlContainers.appendCard(_this.htmlContainers.userViolin, "Users distribution (" + d.group + ")");
            var usersData = violinData.map(function (d) {
                return d.getUsersData(d);
            });
            _this.usersViolin = new ViolinChartSeries("group-violin-users-chart", violinData.map(function (d) { return d.group; }));
            _this.usersViolin.elements.preRender(_this.usersViolin);
            _this.usersViolin.elements.renderViolinThresholds(_this.usersViolin, [30, 70]);
            _this.usersViolin = _this.renderViolin(_this.usersViolin, usersData);
            _this.handleGroupCompare(data, violinData);
            //Draw selected group timeline 
            _this.htmlContainers.groupTimeline = _this.htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
            var timelineCard = _this.htmlContainers.appendCard(_this.htmlContainers.groupTimeline, "Reflections vs Time (" + d.group + ")");
            timelineCard.select(".card-body")
                .attr("class", "card-body")
                .html("<div class=\"row\">\n                    <div id=\"timeline-plot\" class=\"btn-group btn-group-toggle mr-auto ml-auto\" data-toggle=\"buttons\">\n                        <label class=\"btn btn-light active\">\n                            <input type=\"radio\" name=\"plot\" value=\"density\" checked>Density Plot<br>\n                        </label>\n                        <label class=\"btn btn-light\">\n                            <input type=\"radio\" name=\"plot\" value=\"scatter\">Scatter Plot<br>\n                        </label>\n                    </div>\n                </div>")
                .append("div")
                .attr("class", "chart-container");
            var timelineChart = new ChartTime("group-timeline", d3.extent(d.value.map(function (d) { return d.timestamp; })));
            timelineChart.elements.preRender(timelineChart);
            _this.renderTimelineDensity(timelineChart, d);
            var timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(d.value.map(function (d) { return d.timestamp; })));
            _this.handleTimelineButtons(timelineChart, timelineZoomChart, d);
            //Scroll
            document.querySelector("#groups-statistics").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        //Enable sort
        if (d3.select(".y-label-container .sort-arrow").empty()) {
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
                _this.interactions.click.appendGroupsText(chart, data, data[data.map(function (d) { return d.group; }).indexOf(d3.select("#groups-statistics .card").attr("id"))]);
            }
        });
        return chart;
    };
    ;
    AdminExperimentalCharts.prototype.renderViolin = function (chart, data) {
        var _this = this;
        chart = _super.prototype.renderViolin.call(this, chart, data);
        var thresholds = chart.elements.getThresholdsValues(chart);
        var tDistressed = thresholds[0];
        var tSoaring = thresholds[1];
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
        function dragStartSoaring(e, d) {
            chart.elements.contentContainer.selectAll("." + chart.id + "-violin-text-container").remove();
            d3.select(this).attr("class", d3.select(this).attr("class") + " grabbing");
        }
        function draggingSoaring(e, d) {
            if (chart.y.scale.invert(e.y) < 51 || chart.y.scale.invert(e.y) > 99) {
                return;
            }
            d3.select(this)
                .attr("y1", chart.y.scale(chart.y.scale.invert(e.y)))
                .attr("y2", chart.y.scale(chart.y.scale.invert(e.y)));
            tSoaring = chart.y.scale.invert(e.y);
            chart.thresholdAxis.tickValues([tDistressed, chart.y.scale.invert(e.y)])
                .tickFormat(function (d) { return d == tDistressed ? "Distressed" : d == chart.y.scale.invert(e.y) ? "Soaring" : ""; });
            chart.elements.contentContainer.selectAll(".threshold-axis")
                .call(chart.thresholdAxis);
            var positionX = chart.width - chart.padding.yAxis - chart.padding.right + 5;
            var positionY = chart.y.scale(tSoaring) + 25;
            var indicator = chart.elements.contentContainer.select(".threshold-indicator-container.soaring");
            if (positionY + indicator.node().getBBox().height > chart.y.scale(tDistressed)) {
                positionY = chart.y.scale(tSoaring) - 15;
            }
            indicator.attr("transform", "translate(" + positionX + ", " + positionY + ")");
            indicator.select("text")
                .text(Math.round(tSoaring));
        }
        function dragEndSoaring(e, d) {
            var newT = chart.y.scale.invert(e.y);
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
        function dragStartDistressed(e, d) {
            chart.elements.contentContainer.selectAll("." + chart.id + "-violin-text-container").remove();
            d3.select(this).attr("class", d3.select(this).attr("class") + " grabbing");
        }
        function draggingDistressed(e, d) {
            if (chart.y.scale.invert(e.y) < 1 || chart.y.scale.invert(e.y) > 49) {
                return;
            }
            d3.select(this)
                .attr("y1", chart.y.scale(chart.y.scale.invert(e.y)))
                .attr("y2", chart.y.scale(chart.y.scale.invert(e.y)));
            tDistressed = chart.y.scale.invert(e.y);
            chart.thresholdAxis.tickValues([chart.y.scale.invert(e.y), tSoaring])
                .tickFormat(function (d) { return d == chart.y.scale.invert(e.y) ? "Distressed" : d == tSoaring ? "Soaring" : ""; });
            chart.elements.contentContainer.selectAll(".threshold-axis")
                .call(chart.thresholdAxis);
            var soaringIndicator = chart.elements.contentContainer.select(".threshold-indicator-container.soaring");
            if (chart.y.scale(tDistressed) < chart.y.scale(tSoaring) + soaringIndicator.node().getBBox().height + 25) {
                soaringIndicator.attr("transform", "translate(" + (chart.width - chart.padding.yAxis - chart.padding.right + 5) + ", " + (chart.y.scale(tSoaring) - 15) + ")");
            }
            else {
                soaringIndicator.attr("transform", "translate(" + (chart.width - chart.padding.yAxis - chart.padding.right + 5) + ", " + (chart.y.scale(tSoaring) + 25) + ")");
            }
            var indicator = chart.elements.contentContainer.select(".threshold-indicator-container.distressed")
                .attr("transform", "translate(" + (chart.width - chart.padding.yAxis - chart.padding.right + 5) + ", " + (chart.y.scale(tDistressed) + 25) + ")");
            indicator.select("text")
                .text(Math.round(tDistressed));
        }
        function dragEndDistressed(e, d) {
            var newT = chart.y.scale.invert(e.y);
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
    ;
    AdminExperimentalCharts.prototype.renderTimelineScatter = function (chart, zoomChart, data) {
        var _this = this;
        chart = _super.prototype.renderTimelineScatter.call(this, chart, zoomChart, data);
        //Enable click
        _this.interactions.click.enableClick(chart, onClick);
        function onClick(e, d) {
            if (d3.select(this).attr("class") == "line-circle clicked") {
                _this.interactions.click.removeClick(chart);
                chart.elements.content.attr("class", "line-circle");
                chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line").remove();
                _this.htmlContainers.removeUsers();
                return;
            }
            _this.interactions.click.removeClick(chart);
            chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line").remove();
            //Remove users html containers
            _this.htmlContainers.removeUsers();
            chart.elements.content.attr("class", function (data) { return "line-circle " + (data.pseudonym == d.pseudonym ? "clicked" : ""); });
            var userData = data.value.filter(function (c) { return c.pseudonym == d.pseudonym; });
            var line = d3.line()
                .x(function (d) { return chart.x.scale(d.timestamp); })
                .y(function (d) { return chart.y.scale(d.point); });
            chart.elements.contentContainer.append("path")
                .datum(d3.sort(userData, function (d) { return d.timestamp; }))
                .classed("line", true)
                .attr("id", chart.id + "-timeline-circles-line")
                .attr("d", function (d) { return line(d); });
            //Draw click containers
            userData.forEach(function (c) { return _this.interactions.click.appendScatterText(chart, c, c.point.toString()); });
            //Draw user statistics container
            _this.htmlContainers.userStatistics = _this.htmlContainers.appendDiv("user-statistics", "col-md-3 mt-3");
            var userStatisticsCard = _this.htmlContainers.appendCard(_this.htmlContainers.userStatistics, d.pseudonym + "'s statistics");
            var userMean = Math.round(d3.mean(userData.map(function (r) { return r.point; })));
            var groupMean = Math.round(d3.mean(data.value.map(function (d) { return d.point; })));
            userStatisticsCard.select(".card-body")
                .attr("class", "card-body statistics-text")
                .html("<b>Mean: </b>" + userMean + " (<span class=\"" + ((userMean - groupMean) < 0 ? "negative" : "positive") + "\">" + ((userMean - groupMean) < 0 ? "" : "+") + (userMean - groupMean) + "</span> compared to the group mean)<br>\n                    <b>Min: </b>" + d3.min(userData.map(function (r) { return r.point; })) + "<br>\n                    <b>Min date: </b>" + ((d3.sort(userData, function (r) { return r.point; })[0]).timestamp).toDateString() + "<br>\n                    <b>Max: </b>" + d3.max(userData.map(function (r) { return r.point; })) + "<br>\n                    <b>Max date: </b>" + ((d3.sort(userData, function (r) { return r.point; })[userData.length - 1]).timestamp).toDateString() + "<br>\n                    <b>Total: </b>" + userData.length + "<br>\n                    <b>Std Deviation: </b>" + new AnalyticsChartsDataStats(data).roundDecimal(d3.deviation(userData.map(function (r) { return r.point; }))) + "<br>\n                    <b>Variance: </b>" + new AnalyticsChartsDataStats(data).roundDecimal(d3.variance(userData.map(function (r) { return r.point; }))) + "<br>\n                    <b>Oldest reflection: </b>" + (d3.min(userData.map(function (r) { return r.timestamp; }))).toDateString() + "<br>\n                    <b>Newest reflection: </b>" + (d3.max(userData.map(function (r) { return r.timestamp; }))).toDateString() + "<br>");
            //Draw user reflections container
            _this.htmlContainers.reflections = _this.htmlContainers.appendDiv("reflections-list", "col-md-9 mt-3");
            var reflectionsCard = _this.htmlContainers.appendCard(_this.htmlContainers.reflections, d.pseudonym + "'s reflections");
            var reflectionsCardText = "";
            d3.sort(userData, function (r) { return r.timestamp; }).forEach(function (c) {
                reflectionsCardText = reflectionsCardText + ("<p><b>" + c.timestamp.toDateString() + " - State: " + c.point + "</b><br>" + c.text + "</p>");
            });
            reflectionsCard.select(".card-body")
                .attr("class", "card-body statistics-text")
                .html(reflectionsCardText);
            //Scroll
            document.querySelector("#group-timeline").scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return chart;
    };
    ;
    AdminExperimentalCharts.prototype.renderTimelineDensity = function (chart, data) {
        chart = _super.prototype.renderTimelineDensity.call(this, chart, data);
        this.interactions.click.removeClick(chart);
        return chart;
    };
    ;
    AdminExperimentalCharts.prototype.getGroupCompareData = function (data, id) {
        var compareData = [];
        d3.select("#group-compare .card-body").selectAll("div").each(function (d, i, g) {
            d3.select(g[i]).select("input").property("checked") == null ? "" : compareData.push(d);
        });
        return data.filter(function (d) { return compareData.includes(d) || d.group == id; });
    };
    AdminExperimentalCharts.prototype.renderGroupCompare = function (data, id) {
        var compareData = data.filter(function (d) { return d.group != id; });
        var selectedGroupCompare = this.getGroupCompareData(data, id);
        d3.select("#group-compare .card-body").selectAll("div").remove();
        return d3.select("#group-compare .card-body").selectAll("div")
            .data(compareData)
            .enter()
            .append("div")
            .attr("class", "form-check")
            .html(function (d) { return "<input class=\"form-check-input\" type=\"checkbox\" value=\"" + d.group + "\" id=\"compare-" + d.group + "\" " + (selectedGroupCompare.includes(d) ? "checked" : "") + " />\n            <label class=\"form-check-label\" for=\"compare-" + d.group + "\">" + d.group + "</label>"; });
    };
    ;
    AdminExperimentalCharts.prototype.handleGroupCompare = function (data, compareData) {
        var _this = this;
        d3.selectAll("#group-compare input").on("change", function (e, d) {
            var target = e.target;
            if (target.checked) {
                compareData.push(data.find(function (d) { return d.group == target.value; }));
            }
            else {
                compareData.splice(compareData.indexOf(data.find(function (d) { return d.group == target.value; })), 1);
            }
            var groupData = d3.filter(data, function (d) { return compareData.includes(d); });
            var usersData = groupData.map(function (d) { return d.getUsersData(d); });
            _this.violin.x = new ChartSeriesAxis("Group Code", groupData.map(function (r) { return r.group; }), [0, _this.violin.width - _this.violin.padding.yAxis - _this.violin.padding.right]);
            _this.usersViolin.x = new ChartSeriesAxis("Group Code", groupData.map(function (r) { return r.group; }), [0, _this.usersViolin.width - _this.usersViolin.padding.yAxis - _this.usersViolin.padding.right]);
            _this.interactions.axisSeries(_this.violin, groupData);
            _this.interactions.axisSeries(_this.usersViolin, usersData);
            _this.renderViolin(_this.violin, groupData);
            _this.renderViolin(_this.usersViolin, usersData);
        });
    };
    ;
    return AdminExperimentalCharts;
}(AdminControlCharts));
var AdminExperimentalInteractions = /** @class */ (function (_super) {
    __extends(AdminExperimentalInteractions, _super);
    function AdminExperimentalInteractions() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.click = new Click();
        _this_1.sort = new Sort();
        return _this_1;
    }
    return AdminExperimentalInteractions;
}(AdminControlInteractions));
/* ------------------------------------------------
    End of admin experimental interfaces and classes
-------------------------------------------------- */
function buildControlAdminAnalyticsCharts(entries) {
    drawCharts(entries);
    function drawCharts(allEntries) {
        var adminControlCharts = new AdminControlCharts();
        //Handle sidebar button
        adminControlCharts.sidebarBtn();
        //Create data with current entries
        var data = allEntries.map(function (d) { return new AnalyticsChartsDataStats(d); });
        //Append groups chart container
        adminControlCharts.htmlContainers.groupsChart = adminControlCharts.htmlContainers.appendDiv("groups-chart", "col-md-9");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.groupsChart, "Reflections box plot by group");
        //Create group chart with current data
        var groupChart = new ChartSeries("groups-chart", data.map(function (d) { return d.group; }));
        groupChart.elements.preRender(groupChart);
        adminControlCharts.renderGroupChart(groupChart, data);
        //Append group general statistics
        adminControlCharts.htmlContainers.groupStatistics = adminControlCharts.htmlContainers.appendDiv("groups-statistics", "col-md-3");
        var cardGroupStats = adminControlCharts.htmlContainers.groupStatistics.selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "card");
        cardGroupStats.each(function (d, i, g) {
            d3.select(g[i])
                .append("div")
                .attr("class", "card-header")
                .append("button")
                .attr("class", "btn btn-link")
                .attr("data-target", "#stats-" + d.group)
                .attr("data-toggle", "collapse")
                .html(d.group);
            d3.select(g[i])
                .append("div")
                .attr("id", "stats-" + d.group)
                .attr("class", "collapse " + (i == 0 ? "show" : ""))
                .append("div")
                .attr("class", "card-body");
            adminControlCharts.renderGroupStats(d3.select(g[i]), d);
        });
        //Draw groups violin container  
        adminControlCharts.htmlContainers.groupViolin = adminControlCharts.htmlContainers.appendDiv("group-violin-chart", "col-md-6 mt-3");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.groupViolin, "Reflections distribution");
        var violinChart = new ViolinChartSeries("group-violin-chart", data.map(function (d) { return d.group; }));
        violinChart.elements.preRender(violinChart);
        violinChart.elements.renderViolinThresholds(violinChart, [30, 70]);
        adminControlCharts.renderViolin(violinChart, data);
        //Draw users violin container
        adminControlCharts.htmlContainers.userViolin = adminControlCharts.htmlContainers.appendDiv("group-violin-users-chart", "col-md-6 mt-3");
        adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.userViolin, "Users distribution");
        var usersData = data.map(function (d) {
            return d.getUsersData(d);
        });
        var violinUsersChart = new ViolinChartSeries("group-violin-users-chart", data.map(function (d) { return d.group; }));
        violinUsersChart.elements.preRender(violinUsersChart);
        violinUsersChart.elements.renderViolinThresholds(violinUsersChart, [30, 70]);
        adminControlCharts.renderViolin(violinUsersChart, usersData);
        //Draw selected group timeline 
        adminControlCharts.htmlContainers.groupTimeline = adminControlCharts.htmlContainers.appendDiv("group-timeline", "col-md-12 mt-3");
        var timelineCard = adminControlCharts.htmlContainers.appendCard(adminControlCharts.htmlContainers.groupTimeline, "Reflections vs Time");
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
            .attr("class", function (d, i) { return "nav-link " + (i == 0 ? "active" : ""); })
            .attr("href", function (d) { return "#timeline-" + d.group; })
            .html(function (d) { return d.group; });
        timelineCard.select(".card-body")
            .append("div")
            .attr("class", "row mt-3")
            .html(function (d) { return "<div id=\"timeline-plot\" class=\"btn-group btn-group-toggle mr-auto ml-auto\" data-toggle=\"buttons\">\n                                                        <label class=\"btn btn-light active\">\n                                                            <input type=\"radio\" name=\"plot\" value=\"density\" checked>Density Plot<br>\n                                                        </label>\n                                                        <label class=\"btn btn-light\">\n                                                            <input type=\"radio\" name=\"plot\" value=\"scatter\">Scatter Plot<br>\n                                                        </label>\n                                                    </div>"; });
        timelineCard.append("div")
            .attr("class", "chart-container");
        var timelineChart = new ChartTime("group-timeline", d3.extent(data[0].value.map(function (d) { return d.timestamp; })));
        timelineChart.elements.preRender(timelineChart);
        adminControlCharts.renderTimelineDensity(timelineChart, data[0]);
        var timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(data[0].value.map(function (d) { return d.timestamp; })));
        adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, data[0]);
        timelineCard.selectAll("a")
            .on("click", function (e, d) {
            timelineCard.selectAll("a")
                .each(function (x, i, g) {
                if (x == d) {
                    d3.select(g[i])
                        .attr("class", "nav-link active");
                }
                else {
                    d3.select(g[i])
                        .attr("class", "nav-link");
                }
            });
            timelineChart.x = new ChartTimeAxis("Time", d3.extent(d.value.map(function (d) { return d.timestamp; })), [0, timelineChart.width - timelineChart.padding.yAxis]);
            timelineZoomChart.x = new ChartTimeAxis("Time", d3.extent(d.value.map(function (d) { return d.timestamp; })), [0, timelineChart.width - timelineChart.padding.yAxis]);
            adminControlCharts.interactions.axisTime(timelineChart, d);
            if (timelineChart.elements.contentContainer.selectAll("#" + timelineChart.id + "-timeline-contours").empty()) {
                adminControlCharts.renderTimelineScatter(timelineChart, timelineZoomChart, d);
            }
            else {
                timelineChart.elements.contentContainer.selectAll("#" + timelineChart.id + "-timeline-contours").remove();
                adminControlCharts.renderTimelineDensity(timelineChart, d);
            }
            adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, d);
        });
    }
}
//exports.buildControlAdminAnalyticsCharts = buildControlAdminAnalyticsCharts;
function buildExperimentAdminAnalyticsCharts(entries) {
    drawCharts(entries);
    function drawCharts(allEntries) {
        var adminExperimentalCharts = new AdminExperimentalCharts();
        //Handle sidebar button
        adminExperimentalCharts.sidebarBtn();
        //Preloaded groups
        var entries = adminExperimentalCharts.preloadGroups(allEntries);
        //Create data with current entries
        var data = entries.map(function (d) { return new AnalyticsChartsDataStats(d); });
        //Append groups chart container
        adminExperimentalCharts.htmlContainers.groupsChart = adminExperimentalCharts.htmlContainers.appendDiv("groups-chart", "col-md-9");
        adminExperimentalCharts.htmlContainers.appendCard(adminExperimentalCharts.htmlContainers.groupsChart, "Reflections box plot by group");
        //Create group chart with current data
        var groupChart = new ChartSeries("groups-chart", data.map(function (d) { return d.group; }));
        groupChart.elements.preRender(groupChart);
        groupChart = adminExperimentalCharts.renderGroupChart(groupChart, data);
        //Update charts depending on group
        adminExperimentalCharts.handleGroups(groupChart, allEntries.map(function (d) { return new AnalyticsChartsDataStats(d); }));
    }
}
//exports.buildExperimentAdminAnalyticsCharts = buildExperimentAdminAnalyticsCharts;
