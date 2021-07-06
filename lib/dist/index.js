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
var AnalyticsChartsDataStats = /** @class */ (function () {
    function AnalyticsChartsDataStats(entries) {
        var uniqueUsers = Array.from(d3.rollup(entries.value, function (d) { return d.length; }, function (d) { return d.pseudonym; }), function (_a) {
            var key = _a[0], value = _a[1];
            return ({ key: key, value: value });
        });
        this.value = entries.value;
        this.group = entries.group;
        this.selected = entries.selected;
        this.mean = Math.round(d3.mean(entries.value.map(function (r) { return r.point; }))),
            this.median = d3.median(entries.value.map(function (r) { return r.point; })),
            this.q1 = d3.quantile(entries.value.map(function (r) { return r.point; }), 0.25),
            this.q3 = d3.quantile(entries.value.map(function (r) { return r.point; }), 0.75),
            this.max = d3.max(entries.value.map(function (r) { return r.point; })),
            this.min = d3.min(entries.value.map(function (r) { return r.point; })),
            this.variance = this.roundDecimal(d3.variance(entries.value.map(function (r) { return r.point; }))),
            this.deviation = this.roundDecimal(d3.deviation(entries.value.map(function (r) { return r.point; }))),
            this.oldestReflection = d3.min(entries.value.map(function (r) { return new Date(r.timestamp); })),
            this.newestReflection = d3.max(entries.value.map(function (r) { return new Date(r.timestamp); })),
            this.avgReflectionsPerUser = this.roundDecimal(d3.mean(uniqueUsers.map(function (r) { return r.value; }))),
            this.userMostReflective = d3.max(uniqueUsers.map(function (r) { return r.value; })),
            this.userLessReflective = d3.min(uniqueUsers.map(function (r) { return r.value; })),
            this.totalUsers = uniqueUsers.length;
    }
    ;
    AnalyticsChartsDataStats.prototype.roundDecimal = function (value) {
        var p = d3.precisionFixed(0.1);
        var f = d3.format("." + p + "f");
        return f(value);
    };
    return AnalyticsChartsDataStats;
}());
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
        var _this = _super.call(this, id, domain) || this;
        _this.elements = new ViolinChartElements();
        _this.padding = new ChartPadding(50, 75, 25, 85);
        _this.thresholdAxis = _this.y.setThresholdAxis(30, 70);
        return _this;
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
        var yScale = chart.y.scale;
        thresholds.forEach(function (c, i) {
            var indicator = chart.elements.contentContainer.append("g")
                .attr("class", "threshold-indicator-container " + (i == 0 ? "distressed" : "soaring"))
                .attr("transform", "translate(" + (chart.width - chart.padding.yAxis - chart.padding.right + 5) + ", " + (yScale(c) + 25) + ")");
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
        var yScale = chart.y.scale;
        thresholds.forEach(function (c, i) {
            chart.elements.contentContainer.append("line")
                .attr("class", "threshold-line " + (i == 0 ? "distressed" : "soaring"))
                .attr("x1", 0)
                .attr("x2", chart.width - chart.padding.yAxis - chart.padding.right)
                .attr("y1", yScale(c))
                .attr("y2", yScale(c));
        });
    };
    ;
    ViolinChartElements.prototype.appendThresholdPercentages = function (chart, bin, bandwithScale, tDistressed, tSoaring) {
        var yScale = chart.y.scale;
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
            .attr("x", bandwithScale(0) - binText.node().getBBox().width / 2)
            .on("mouseover", onMouseover)
            .on("mouseout", onMouseout);
        function positionY(i) {
            return yScale(i == 0 ? tDistressed / 2 : i == 1 ? 50 : (100 - tSoaring) / 2 + tSoaring) - binTextBox.node().getBBox().height / 2;
        }
        function onMouseover(e, d) {
            chartFunctions.tooltip.appendTooltipText(chart, "Count: " + d.bin.length.toString());
            chartFunctions.tooltip.positionTooltipContainer(chart, bandwithScale(0) + (3 * binTextBox.node().getBBox().width), parseInt(d3.select(this).attr("y")) - binTextBox.node().getBBox().height);
        }
        function onMouseout() {
            chart.elements.svg.select(".tooltip-container").transition()
                .style("opacity", 0);
            chartFunctions.tooltip.removeTooltip(chart);
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
var AdminControlCharts = /** @class */ (function () {
    function AdminControlCharts() {
        this.transitions = new AdminControlTransitions();
    }
    AdminControlCharts.prototype.preloadGroups = function (allEntries) {
        d3.selectAll("#groups input").each(function () {
            var _this = this;
            d3.select(this).attr("checked") == null ? "" : allEntries.find(function (d) { return d.group == d3.select(_this).attr("value"); }).selected = true;
        });
        return d3.filter(allEntries, function (d) { return d.selected == true; });
    };
    ;
    AdminControlCharts.prototype.handleGroups = function (chart, allEntries) {
        var _this = this;
        d3.selectAll("#groups input").on("change", function (e) {
            var target = e.target;
            allEntries.find(function (d) { return d.selected == true; }).selected = false;
            allEntries.find(function (d) { return d.group == target.value; }).selected = true;
            var entries = d3.filter(allEntries, function (d) { return d.selected == true; });
            _this.renderGroupChart(chart, entries.map(function (d) { return new AnalyticsChartsDataStats(d); }));
        });
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
        this.transitions.bars(chart, data);
        //Set render elements content to boxes
        chart.elements.content = chart.elements.contentContainer.selectAll("#" + chart.id + "-data");
        //Enable tooltip
        chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
        function onMouseover(e, d) {
            //If box is clicked not append tooltip
            if (d3.select(this).attr("class").includes("clicked")) {
                return;
            }
            //Append tooltip box with text
            var tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, d.group, [{ label: "q1", value: d.q1 }, { label: "q3", value: d.q3 }, { label: "Median", value: d.median }, { label: "Mean", value: d.mean }, { label: "Max", value: d.max }, { label: "Min", value: d.min }]);
            //Position tooltip container
            chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.q3, tooltipBox));
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
            chartFunctions.tooltip.removeTooltip(chart);
        }
        return chart;
    };
    return AdminControlCharts;
}());
var AdminControlTransitions = /** @class */ (function () {
    function AdminControlTransitions() {
    }
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
    return AdminControlTransitions;
}());
function buildControlAdminAnalyticsCharts(entries) {
    //Handle sidebar button
    sidebarFunctions.sidebarBtn();
    drawCharts(entries);
    function drawCharts(allEntries) {
        var htmlContainer = new HtmlContainers();
        var adminControlCharts = new AdminControlCharts();
        //Append groups chart container
        htmlContainer.groupsChart = htmlContainer.appendDiv("groups-chart", "col-md-9");
        htmlContainer.appendCard(htmlContainer.groupsChart, "Reflections box plot by group");
        //Preloaded groups
        var entries = adminControlCharts.preloadGroups(allEntries);
        //Create data with current entries
        var data = entries.map(function (d) { return new AnalyticsChartsDataStats(d); });
        //Create group chart with current data
        var groupChart = new ChartSeries("groups-chart", data.map(function (d) { return d.group; }));
        groupChart.elements.preRender(groupChart);
        adminControlCharts.renderGroupChart(groupChart, data);
        adminControlCharts.handleGroups(groupChart, allEntries);
    }
}
//exports.buildControlAdminAnalyticsCharts = buildControlAdminAnalyticsCharts;
function buildExperimentAdminAnalyticsCharts(entries) {
    //Handle sidebar button
    sidebarFunctions.sidebarBtn();
    //Draw charts
    drawCharts(entries);
    function drawCharts(allEntries) {
        var htmlContainer = new HtmlContainers();
        var selectedGroups = [];
        //Preloaded groups
        preloadGroups();
        function preloadGroups() {
            d3.selectAll("#groups input").each(function () {
                d3.select(this).attr("checked") == null ? "" : selectedGroups.push(d3.select(this).attr("value"));
            });
            //Process entries to be drawn
            entries = d3.filter(allEntries, function (d) { return selectedGroups.includes(d.group); });
        }
        ;
        //Handle add or remove groups
        addRemoveGroups();
        function addRemoveGroups() {
            d3.selectAll("#groups input").on("change", function (e) {
                var target = e.target;
                if (target.checked) {
                    //Add group code to the list
                    selectedGroups.push(target.value);
                    //Update data
                    updateData();
                    //Handle there is an active click in the group chart
                    if (groupChart.click) {
                        //Update click text
                        chartFunctions.click.appendGroupsText(groupChart, data, data[data.map(function (d) { return d.group; }).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))]);
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
                    groupChart.elements.contentContainer.selectAll("#" + groupChart.id + " .content-container .click-container")
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
                            chartFunctions.click.appendGroupsText(groupChart, data, data[data.map(function (d) { return d.group; }).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))]);
                            //Update group compare inputs
                            var currentCompareGroups_1 = groupCompare(data, htmlContainer.groupStatistics.select(".card").attr("id"));
                            //Remove removed group code from the compare groups
                            currentCompareGroups_1.splice(currentCompareGroups_1.indexOf(target.value), 1);
                            //Update violin data
                            var violinData = d3.filter(allEntries, function (d) { return currentCompareGroups_1.includes(d.group); });
                            //Update violin chart series scale
                            violinChart.x = new ChartSeriesAxis("Group Code", violinData.map(function (r) { return r.group; }), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right]);
                            //Update violin users chart series scale
                            violinUsersChart.x = new ChartSeriesAxis("Group Code", violinData.map(function (r) { return r.group; }), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right]);
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
                entries = d3.filter(allEntries, function (d) { return selectedGroups.includes(d.group); });
                //Update data with the updated entries
                data = entries.map(function (d) { return new AnalyticsChartsDataStats(d); });
                //Update group chart series scale
                groupChart.x = new ChartSeriesAxis("Group Code", data.map(function (r) { return r.group; }), [0, groupChart.width - groupChart.padding.yAxis - groupChart.padding.right]);
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
        var data = entries.map(function (d) { return new AnalyticsChartsDataStats(d); });
        //Create group chart with current data
        var groupChart = new ChartSeries("groups-chart", data.map(function (d) { return d.group; }));
        //Render svg, containers, standard axis and labels
        groupChart.elements.preRender(groupChart);
        renderGroupChart(groupChart, data);
        function renderGroupChart(chart, data) {
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
            chartFunctions.transitions.bars(chart, data);
            //Set render elements content to boxes
            chart.elements.content = chart.elements.contentContainer.selectAll("#" + chart.id + "-data");
            //Enable tooltip
            chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
            function onMouseover(e, d) {
                //If box is clicked not append tooltip
                if (d3.select(this).attr("class").includes("clicked")) {
                    return;
                }
                //Append tooltip box with text
                var tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, d.group, [{ label: "q1", value: d.q1 }, { label: "q3", value: d.q3 }, { label: "Median", value: d.median }, { label: "Mean", value: d.mean }, { label: "Max", value: d.max }, { label: "Min", value: d.min }]);
                //Position tooltip container
                chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.group, tooltipBox), yTooltip(d.q3, tooltipBox));
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
                chartFunctions.tooltip.removeTooltip(chart);
            }
            //Enable click
            chartFunctions.click.enableClick(chart, onClick);
            function onClick(e, d) {
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
                var groupsStatisticsCard = htmlContainer.appendCard(htmlContainer.groupStatistics, "Statitics (" + d.group + ")", d.group);
                groupsStatisticsCard.select(".card-body")
                    .attr("class", "card-body statistics-text")
                    .html("<b>Q1: </b>" + d.q1 + "<br>\n                        <b>Median: </b>" + d.median + "<br>\n                        <b>Q3: </b>" + d.q3 + "<br>\n                        <b>Mean: </b>" + d.mean + "<br>\n                        <b>Total Reflections: </b>" + d.value.length + "<br>\n                        <b>Variance: </b>" + d.variance + "<br>\n                        <b>Std Deviation: </b>" + d.deviation + "<br>\n                        <b>Max: </b>" + d.max + "<br>\n                        <b>Min: </b>" + d.min + "<br>\n                        <b>Reflections per user: </b>" + d.avgReflectionsPerUser + "<br>\n                        <b>Max reflections per user: </b>" + d.userMostReflective + "<br>\n                        <b>Min reflections per user: </b>" + d.userLessReflective + "<br>\n                        <b>Total Users: </b>" + d.totalUsers + "<br>\n                        <b>Oldest reflection</b><br>" + d.oldestReflection.toDateString() + "<br>\n                        <b>Newest reflection</b><br>" + d.newestReflection.toDateString() + "<br>");
                //Draw compare
                htmlContainer.compare = htmlContainer.appendDiv("group-compare", "col-md-2 mt-3");
                var compareCard = htmlContainer.appendCard(htmlContainer.compare, "Compare " + d.group + " with:");
                compareCard.select(".card-body").attr("class", "card-body");
                var currentCompareGroups = groupCompare(data, d.group);
                //Draw groups violin container  
                htmlContainer.groupViolin = htmlContainer.appendDiv("group-violin-chart", "col-md-5 mt-3");
                htmlContainer.appendCard(htmlContainer.groupViolin, "Reflections distribution (" + d.group + ")");
                //Draw users violin container
                htmlContainer.userViolin = htmlContainer.appendDiv("group-violin-users-chart", "col-md-5 mt-3");
                htmlContainer.appendCard(htmlContainer.userViolin, "Users distribution (" + d.group + ")");
                //Draw violins              
                groupViolinChart(data, currentCompareGroups);
                //Draw selected group timeline 
                htmlContainer.groupTimeline = htmlContainer.appendDiv("group-timeline", "col-md-12 mt-3");
                var timelineCard = htmlContainer.appendCard(htmlContainer.groupTimeline, "Reflections vs Time (" + d.group + ")");
                timelineCard.select(".card-body")
                    .attr("class", "card-body")
                    .html("<div class=\"row\">\n                        <div id=\"timeline-plot\" class=\"btn-group btn-group-toggle mr-auto ml-auto\" data-toggle=\"buttons\">\n                            <label class=\"btn btn-light active\">\n                                <input type=\"radio\" name=\"plot\" value=\"density\" checked>Density Plot<br>\n                            </label>\n                            <label class=\"btn btn-light\">\n                                <input type=\"radio\" name=\"plot\" value=\"scatter\">Scatter Plot<br>\n                            </label>\n                        </div>\n                    </div>")
                    .append("div")
                    .attr("class", "chart-container");
                groupTimeline(d);
                //Scroll
                document.querySelector("#groups-statistics").scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            //Enable sort
            var sortButton = chart.elements.svg.select(".y-label-container").attr("class", "y-label-container zoom");
            var yArrow = chartFunctions.sort.appendArrow(sortButton, chart, false, true);
            sortButton.on("click", function () {
                chart.y.sorted = chart.y.sorted == false ? true : false;
                chartFunctions.sort.arrowTransition(chart.elements.svg, chart, yArrow, false, true);
                data = data.sort(function (a, b) {
                    return chartFunctions.sort.sortData(a.mean, b.mean, chart.y.sorted);
                });
                chartFunctions.transitions.axis(chart, data);
                chartFunctions.transitions.bars(chart, data);
                if (chart.click) {
                    chartFunctions.click.appendGroupsText(chart, data, data[data.map(function (d) { return d.group; }).indexOf(htmlContainer.groupStatistics.select(".card").attr("id"))]);
                }
            });
        }
        function groupTimeline(data) {
            var timelineChart = new ChartTime("group-timeline", d3.extent(data.value.map(function (d) { return d.timestamp; })));
            timelineChart.elements.preRender(timelineChart);
            renderTimelineDensity(timelineChart, data.value);
            var timelineZoomChart = new ChartTimeZoom(timelineChart, d3.extent(data.value.map(function (d) { return d.timestamp; })));
            d3.select("#group-timeline #timeline-plot").on("click", function (e) {
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
            function renderTimelineDensity(chart, data) {
                //Remove scatter plot
                chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles").remove();
                chart.elements.svg.selectAll(".zoom-container").remove();
                //Remove click
                chartFunctions.click.removeClick(chart);
                chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line").remove();
                //Create density data
                var densityData = createDensityData();
                function createDensityData() {
                    return d3.contourDensity()
                        .x(function (d) { return chart.x.scale(d.timestamp); })
                        .y(function (d) { return chart.y.scale(d.point); })
                        .bandwidth(5)
                        .thresholds(20)
                        .size([chart.width - chart.padding.yAxis, chart.height - chart.padding.xAxis - chart.padding.top])(data);
                }
                //Draw contours
                chart.elements.content = chart.elements.contentContainer.selectAll(chart.id + "-timeline-contours")
                    .data(densityData)
                    .enter()
                    .append("path")
                    .attr("id", chart.id + "-timeline-contours")
                    .attr("class", "contour")
                    .attr("d", d3.geoPath())
                    .attr("stroke", function (d) { return d3.interpolateBlues(d.value * 25); })
                    .attr("fill", function (d) { return d3.interpolateBlues(d.value * 20); });
                //Enable zoom
                chartFunctions.zoom.enableZoom(chart, zoomed);
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
            }
            function renderTimelineScatter(chart, zoomChart, data, stats) {
                //Remove density plot
                chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-contours").remove();
                //Draw circles
                chart.elements.content = chart.elements.contentContainer.selectAll(chart.id + "-timeline-circles")
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("line-circle", true)
                    .attr("id", chart.id + "-timeline-circles")
                    .attr("r", 5)
                    .attr("cx", function (d) { return chart.x.scale(d.timestamp); })
                    .attr("cy", function (d) { return chart.y.scale(d.point); });
                //Enable tooltip
                chartFunctions.tooltip.enableTooltip(chart, onMouseover, onMouseout);
                function onMouseover(e, d) {
                    if (d3.select(this).attr("class").includes("clicked")) {
                        return;
                    }
                    var tooltipBox = chartFunctions.tooltip.appendTooltipText(chart, d.timestamp.toDateString(), [{ label: "State", value: d.point }]);
                    chartFunctions.tooltip.positionTooltipContainer(chart, xTooltip(d.timestamp, tooltipBox), yTooltip(d.point, tooltipBox));
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
                function onClick(e, d) {
                    if (d3.select(this).attr("class") == "line-circle clicked") {
                        chartFunctions.click.removeClick(chart);
                        chart.elements.content.attr("class", "line-circle");
                        chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line").remove();
                        htmlContainer.removeUsers();
                        return;
                    }
                    chartFunctions.click.removeClick(chart);
                    chart.elements.contentContainer.selectAll("#" + chart.id + "-timeline-circles-line").remove();
                    //Remove users html containers
                    htmlContainer.removeUsers();
                    chart.elements.content.attr("class", function (data) { return "line-circle " + (data.pseudonym == d.pseudonym ? "clicked" : ""); });
                    var userData = data.filter(function (c) { return c.pseudonym == d.pseudonym; });
                    var line = d3.line()
                        .x(function (d) { return chart.x.scale(d.timestamp); })
                        .y(function (d) { return chart.y.scale(d.point); });
                    chart.elements.contentContainer.append("path")
                        .datum(d3.sort(userData, function (d) { return d.timestamp; }))
                        .classed("line", true)
                        .attr("id", chart.id + "-timeline-circles-line")
                        .attr("d", function (d) { return line(d); });
                    //Draw click containers
                    userData.forEach(function (c) { return chartFunctions.click.appendText(chart, c, c.point.toString()); });
                    //Draw user statistics container
                    htmlContainer.userStatistics = htmlContainer.appendDiv("user-statistics", "col-md-3 mt-3");
                    var userStatisticsCard = htmlContainer.appendCard(htmlContainer.userStatistics, d.pseudonym + "'s statistics");
                    var userMean = Math.round(d3.mean(userData.map(function (r) { return r.point; })));
                    userStatisticsCard.select(".card-body")
                        .attr("class", "card-body statistics-text")
                        .html("<b>Mean: </b>" + userMean + " (<span class=\"" + ((userMean - stats.mean) < 0 ? "negative" : "positive") + "\">" + ((userMean - stats.mean) < 0 ? "" : "+") + (userMean - stats.mean) + "</span> compared to the group mean)<br>\n                            <b>Min: </b>" + d3.min(userData.map(function (r) { return r.point; })) + "<br>\n                            <b>Min date: </b>" + ((d3.sort(userData, function (r) { return r.point; })[0]).timestamp).toDateString() + "<br>\n                            <b>Max: </b>" + d3.max(userData.map(function (r) { return r.point; })) + "<br>\n                            <b>Max date: </b>" + ((d3.sort(userData, function (r) { return r.point; })[userData.length - 1]).timestamp).toDateString() + "<br>\n                            <b>Total: </b>" + userData.length + "<br>\n                            <b>Std Deviation: </b>" + chartFunctions.data.roundDecimal(d3.deviation(userData.map(function (r) { return r.point; }))) + "<br>\n                            <b>Variance: </b>" + chartFunctions.data.roundDecimal(d3.variance(userData.map(function (r) { return r.point; }))) + "<br>\n                            <b>Oldest reflection: </b>" + (d3.min(userData.map(function (r) { return r.timestamp; }))).toDateString() + "<br>\n                            <b>Newest reflection: </b>" + (d3.max(userData.map(function (r) { return r.timestamp; }))).toDateString() + "<br>");
                    //Draw user reflections container
                    htmlContainer.reflections = htmlContainer.appendDiv("reflections-list", "col-md-9 mt-3");
                    var reflectionsCard = htmlContainer.appendCard(htmlContainer.reflections, d.pseudonym + "'s reflections");
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
                    .attr("cx", function (d) { return zoomChart.x.scale(d.timestamp); })
                    .attr("cy", function (d) { return zoomChart.y.scale(d.point); });
                //Draw hidden content that will handle the borders
                chart.elements.zoomFocus.selectAll(chart.id + "zoom-content")
                    .data(data)
                    .enter()
                    .append("circle")
                    .classed("zoom-content", true)
                    .attr("id", chart.id + "zoom-bar-content")
                    .attr("r", 2)
                    .attr("cx", function (d) { return zoomChart.x.scale(d.timestamp); })
                    .attr("cy", function (d) { return zoomChart.y.scale(d.point); });
                //Enable zoom
                chartFunctions.zoom.enableZoom(chart, zoomed);
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
            }
        }
        //Global variables for the violin chart
        var violinChart;
        var violinUsersChart;
        function groupViolinChart(data, groups) {
            var groupData = d3.filter(data, function (d) { return groups.includes(d.group); });
            var currentData = [];
            groupData.forEach(function (c) {
                var userMean = Array.from(d3.rollup(c.value, function (d) { return Math.round(d3.mean(d.map(function (r) { return r.point; }))); }, function (d) { return d.pseudonym; }), function (_a) {
                    var pseudonym = _a[0], point = _a[1];
                    return ({ pseudonym: pseudonym, point: point });
                });
                currentData.push({ group: c.group, value: userMean });
            });
            violinChart = new ViolinChartSeries("group-violin-chart", groupData.map(function (d) { return d.group; }));
            violinChart.x = new ChartSeriesAxis("Group Code", groupData.map(function (r) { return r.group; }), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right]);
            violinChart.elements.preRender(violinChart);
            violinChart.elements.renderViolinThresholds(violinChart, [30, 70]);
            renderViolin(violinChart, groupData);
            violinUsersChart = new ViolinChartSeries("group-violin-users-chart", currentData.map(function (d) { return d.group; }));
            violinUsersChart.padding.right = 85;
            violinUsersChart.x = new ChartSeriesAxis("Group Code", groupData.map(function (r) { return r.group; }), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right]);
            violinUsersChart.elements.preRender(violinUsersChart);
            violinUsersChart.elements.renderViolinThresholds(violinUsersChart, [30, 70]);
            renderViolin(violinUsersChart, currentData);
        }
        function renderViolin(chart, data) {
            var thresholds = chart.elements.getThresholdsValues(chart);
            var tDistressed = thresholds[0];
            var tSoaring = thresholds[1];
            dragViolinThresholds(chart, data, tDistressed, tSoaring);
            drawViolin(chart, data, tDistressed, tSoaring);
            function dragViolinThresholds(chart, data, tDistressed, tSoaring) {
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
                    chartFunctions.transitions.violin(chart, data, tDistressed, newT);
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
                    chartFunctions.transitions.violin(chart, data, newT, tSoaring);
                    d3.select(this).attr("class", d3.select(this).attr("class").replace(" grabbing", ""));
                }
            }
            function drawViolin(chart, data, tDistressed, tSoaring) {
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
                chartFunctions.transitions.violin(chart, data, tDistressed, tSoaring);
            }
        }
        function groupCompare(data, group) {
            var currentGroups = [];
            //Check active groups
            d3.selectAll("#group-compare input").each(function () {
                d3.select(this).property("checked") == null ? "" : currentGroups.push(d3.select(this).attr("value"));
            });
            //Remove groups html
            d3.select("#group-compare .card-body").html("");
            //Select card body
            var container = d3.select("#group-compare .card-body");
            //Append group inputs
            data.map(function (r) { return r.group; }).forEach(function (d) {
                //If current d is the selected group skip rendering input
                if (d == group) {
                    return;
                }
                //Render input
                container.html(container.html() + ("<div class=\"form-check\">\n                                    <input class=\"form-check-input\" type=\"checkbox\" value=\"" + d + "\" id=\"compare-" + d + "\" " + (currentGroups.includes(d) ? "checked" : "") + " />\n                                    <label class=\"form-check-label\" for=\"compare-" + d + "\">" + d + "</label>\n                                </div>"));
            });
            //Handle change group inputs
            d3.selectAll("#group-compare input").on("change", function (e) {
                var target = e.target;
                if (target.checked) {
                    currentGroups.push(target.value);
                }
                else {
                    currentGroups.splice(currentGroups.indexOf(target.value), 1);
                }
                var groupData = d3.filter(data, function (d) { return currentGroups.includes(d.group); });
                var currentData = [];
                groupData.forEach(function (c) {
                    var userMean = Array.from(d3.rollup(c.value, function (d) { return Math.round(d3.mean(d.map(function (r) { return r.point; }))); }, function (d) { return d.pseudonym; }), function (_a) {
                        var pseudonym = _a[0], point = _a[1];
                        return ({ pseudonym: pseudonym, point: point });
                    });
                    currentData.push({ group: c.group, value: userMean });
                });
                violinChart.x = new ChartSeriesAxis("Group Code", groupData.map(function (r) { return r.group; }), [0, violinChart.width - violinChart.padding.yAxis - violinChart.padding.right]);
                violinUsersChart.x = new ChartSeriesAxis("Group Code", groupData.map(function (r) { return r.group; }), [0, violinUsersChart.width - violinUsersChart.padding.yAxis - violinUsersChart.padding.right]);
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
//exports.buildExperimentAdminAnalyticsCharts = buildExperimentAdminAnalyticsCharts;
var sidebarFunctions = {
    sidebarBtn: function () {
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
    }
};
var chartFunctions = {
    data: {
        roundDecimal: function (value) {
            var p = d3.precisionFixed(0.1);
            var f = d3.format("." + p + "f");
            return f(value);
        }
    },
    tooltip: {
        enableTooltip: function (chart, onMouseover, onMouseout) {
            this.appendTooltipContainer(chart);
            chart.elements.content.on("mouseover", onMouseover)
                .on("mouseout", onMouseout);
        },
        appendTooltipContainer: function (chart) {
            chart.elements.contentContainer.selectAll(".tooltip-container").remove();
            return chart.elements.contentContainer.append("g")
                .attr("class", "tooltip-container");
        },
        appendTooltipText: function (chart, title, values) {
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
        },
        appendLine: function (chart, x1, y1, x2, y2) {
            chart.elements.contentContainer.append("line")
                .attr("class", "tooltip-line")
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2);
        },
        positionTooltipContainer: function (chart, x, y) {
            chart.elements.contentContainer.select(".tooltip-container")
                .attr("transform", "translate(" + x + ", " + y + ")")
                .transition()
                .style("opacity", 1);
        },
        removeTooltip: function (chart) {
            chart.elements.contentContainer.selectAll(".tooltip-box").remove();
            chart.elements.contentContainer.selectAll(".tooltip-text").remove();
            chart.elements.contentContainer.selectAll(".tooltip-line").remove();
        }
    },
    sort: {
        appendArrow: function (button, chart, x, y) {
            if (x === void 0) { x = false; }
            if (y === void 0) { y = false; }
            return button.append("polygon")
                .attr("class", "sort-arrow")
                .attr("points", this.arrowPoints(button, chart, x, y));
        },
        arrowPoints: function (svg, chart, x, y) {
            var selector = x == true ? ".x-label-text" : ".y-label-text";
            var height = svg.select(selector).node().getBBox().height;
            var width = svg.select(selector).node().getBBox().width;
            var point1 = [(width / 2) + 5, 0];
            var point2 = [(width / 2) + 5, -height / 2];
            var point3 = [(width / 2) + 15, -height / 4];
            if ((x == true && chart.x.sorted == false) || (y == true && chart.y.sorted == false)) {
                point1 = [-(width / 2) - 5, 0];
                point2 = [-(width / 2) - 5, -height / 2];
                point3 = [-(width / 2) - 15, -height / 4];
            }
            return point1 + ", " + point2 + ", " + point3;
        },
        setSorted: function (chart, x, y) {
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
        },
        arrowTransition: function (svg, chart, arrow, x, y) {
            if (x === void 0) { x = false; }
            if (y === void 0) { y = false; }
            svg.select(".sort-arrow.active")
                .attr("class", "sort-arrow");
            arrow.transition()
                .attr("points", this.arrowPoints(svg, chart, x, y))
                .attr("class", "sort-arrow active");
        },
        sortData: function (a, b, sorted) {
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
        enableClick: function (chart, onClick) {
            chart.elements.content.on("click", onClick);
        },
        removeClick: function (chart) {
            chart.click = false;
            chart.elements.contentContainer.selectAll(".click-text").remove();
            chart.elements.contentContainer.selectAll(".click-line").remove();
            chart.elements.contentContainer.selectAll(".click-container").remove();
        },
        removeClickClass: function (chart, css) {
            d3.selectAll("#" + chart.id + " .content-container ." + css)
                .attr("class", css);
        },
        appendText: function (chart, d, title, values) {
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
        },
        positionClickContainer: function (chart, box, text, d) {
            //Set scale types
            var xScale = chart.x.scale;
            var yScale = chart.y.scale;
            var positionX = xScale(d.timestamp);
            var positionY = yScale(d.point) - box.node().getBBox().height - 10;
            if (chart.width - chart.padding.yAxis < xScale(d.timestamp) + text.node().getBBox().width) {
                positionX = xScale(d.timestamp) - box.node().getBBox().width;
            }
            ;
            if (yScale(d.point) - box.node().getBBox().height - 10 < 0) {
                positionY = positionY + box.node().getBBox().height + 20;
            }
            ;
            return "translate(" + positionX + ", " + positionY + ")";
        },
        appendGroupsText: function (chart, data, clickData) {
            var _this = this;
            //Set scale types
            var xScale = chart.x.scale;
            var yScale = chart.y.scale;
            chart.elements.contentContainer.selectAll(".click-container text").remove();
            chart.elements.content.attr("class", function (d) { return d.group == clickData.group ? "bar clicked" : "bar"; });
            var clickContainer = chart.elements.contentContainer.selectAll(".click-container")
                .data(data);
            clickContainer.enter()
                .append("g")
                .merge(clickContainer)
                .attr("class", "click-container")
                .attr("transform", function (c) { return "translate(" + (xScale(c.group) + xScale.bandwidth() / 2) + ", 0)"; });
            clickContainer.exit().remove();
            chart.elements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", function (c) { return _this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[0]; })
                .attr("y", function (c) { return yScale(c.q3) - 5; })
                .text(function (c) { return "q3: " + _this.comparativeText(clickData.q3, c.q3, clickData.group, c.group)[1]; });
            chart.elements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", function (c) { return _this.comparativeText(clickData.median, c.median, clickData.group, c.group)[0]; })
                .attr("y", function (c) { return yScale(c.median) - 5; })
                .text(function (c) { return "Median: " + _this.comparativeText(clickData.median, c.median, clickData.group, c.group)[1]; });
            chart.elements.contentContainer.selectAll(".click-container").append("text")
                .attr("class", function (c) { return _this.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[0]; })
                .attr("y", function (c) { return yScale(c.q1) - 5; })
                .text(function (c) { return "q1: " + _this.comparativeText(clickData.q1, c.q1, clickData.group, c.group)[1]; });
        },
        comparativeText: function (clickValue, value, clickXValue, xValue) {
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
        }
    },
    zoom: {
        enableZoom: function (chart, zoomed) {
            chart.elements.svg.selectAll(".zoom-rect")
                .attr("class", "zoom-rect active");
            var zoom = d3.zoom()
                .scaleExtent([1, 5])
                .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
                .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
                .on("zoom", zoomed);
            chart.elements.contentContainer.select(".zoom-rect").call(zoom);
        },
        appendZoomBar: function (chart) {
            return chart.elements.svg.append("g")
                .attr("class", "zoom-container")
                .attr("height", 30)
                .attr("width", chart.width - chart.padding.yAxis)
                .attr("transform", "translate(" + chart.padding.yAxis + ", " + (chart.height - 30) + ")");
        }
    },
    transitions: {
        axis: function (chart, data) {
            var xScale = chart.x.scale;
            xScale.domain(data.map(function (d) { return d.group; }));
            d3.select("#" + chart.id + " .x-axis").transition()
                .duration(750)
                .call(chart.x.axis);
        },
        bars: function (chart, data) {
            var xScale = chart.x.scale;
            var yScale = chart.y.scale;
            d3.selectAll("#" + chart.id + " .content-container #" + chart.id + "-data")
                .data(data)
                .transition()
                .duration(750)
                .attr("width", function (d) { return xScale.bandwidth(); })
                .attr("height", function (d) { return yScale(d.q1) - yScale(d.q3); })
                .attr("y", function (d) { return yScale(d.q3); })
                .attr("x", function (d) { return xScale(d.group); });
            d3.selectAll("#" + chart.id + " .content-container #" + chart.id + "-data")
                .data(data)
                .transition()
                .duration(750)
                .attr("width", function (d) { return xScale.bandwidth(); })
                .attr("height", function (d) { return yScale(d.q1) - yScale(d.q3); })
                .attr("y", function (d) { return yScale(d.q3); })
                .attr("x", function (d) { return xScale(d.group); });
            d3.selectAll("#" + chart.id + " #" + chart.id + "-data-min-max")
                .data(data)
                .transition()
                .duration(750)
                .attr("x1", function (d) { return xScale(d.group) + (xScale.bandwidth() / 2); })
                .attr("y1", function (d) { return yScale(d.min); })
                .attr("x2", function (d) { return xScale(d.group) + (xScale.bandwidth() / 2); })
                .attr("y2", function (d) { return yScale(d.max); });
            d3.selectAll("#" + chart.id + " #" + chart.id + "-data-median")
                .data(data)
                .transition()
                .duration(750)
                .attr("x1", function (d) { return xScale(d.group); })
                .attr("y1", function (d) { return yScale(d.median); })
                .attr("x2", function (d) { return xScale(d.group) + xScale.bandwidth(); })
                .attr("y2", function (d) { return yScale(d.median); });
        },
        violin: function (chart, data, tDistressed, tSoaring) {
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
            //Append tooltip container
            chartFunctions.tooltip.appendTooltipContainer(chart);
            //Draw threshold percentages
            chart.elements.appendThresholdPercentages(chart, bin, bandwithScale, tDistressed, tSoaring);
        }
    }
};
