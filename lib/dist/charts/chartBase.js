import { ChartSeriesAxis, ChartTimeAxis, ChartLinearAxis } from "./scaleBase.js";
import { Help } from "./help.js";
import { ChartElements } from "./render.js";
import { getDOMRect } from "../utils/utils.js";
export class ChartPadding {
    constructor(xAxis, yAxis, top, right) {
        this.xAxis = xAxis == undefined ? 40 : xAxis;
        this.yAxis = yAxis == undefined ? 75 : yAxis;
        this.top = top == undefined ? 5 : top;
        this.right = right == undefined ? 0 : right;
    }
}
export class ChartSeries {
    constructor(id, domain, isGoingOk = true, yDomain) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .chart-container`);
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding();
        if (!isGoingOk) {
            this.padding.yAxis = 40;
        }
        this.y = new ChartLinearAxis(isGoingOk ? "Reflection Point" : "", isGoingOk ? [0, 100] : yDomain, [this.height - this.padding.xAxis - this.padding.top, 0], "left", isGoingOk);
        this.x = new ChartSeriesAxis("Group Code", domain, [0, this.width - this.padding.yAxis - this.padding.right]);
        this.click = false;
        this.elements = new ChartElements(this);
    }
}
export class ChartTime {
    constructor(id, domain, chartPadding) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .chart-container`);
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = chartPadding !== undefined ? chartPadding : new ChartPadding(75, 75, 5);
        this.help = new Help();
        this.y = new ChartLinearAxis("Reflection Point", [0, 100], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartTimeAxis("Time", domain, [0, this.width - this.padding.yAxis]);
        this.click = false;
        this.elements = new ChartElements(this);
    }
}
export class ChartTimeZoom {
    constructor(chart, domain) {
        this.x = new ChartTimeAxis("", domain, [0, chart.width - chart.padding.yAxis - 5]);
        this.y = new ChartLinearAxis("", [0, 100], [25, 0], "left");
    }
}
export class UserChart {
    constructor(id, containerClass) {
        this.id = id;
        let containerDimensions = getDOMRect(`#${id} .${containerClass}`);
        this.width = containerDimensions.width;
        this.height = containerDimensions.height;
        this.padding = new ChartPadding(40, 55, 10, 10);
        this.y = new ChartSeriesAxis("", ["distressed", "going ok", "soaring"], [this.height - this.padding.xAxis - this.padding.top, 0], "left");
        this.x = new ChartLinearAxis("", [0, 100], [0, this.width - this.padding.yAxis - this.padding.right], "bottom", false);
        this.x.axis.tickValues([0, 25, 50, 75, 100]);
        this.click = false;
        this.elements = new ChartElements(this, containerClass);
    }
}
