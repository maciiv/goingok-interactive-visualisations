;
import { IAdminAnalyticsData, IReflectionAuthor } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { ITooltipValues, Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { Zoom } from "../../interactions/zoom.js";
import { ChartTime, ExtendChart, IChart, IChartScales } from "../chartBase.js";
import { ChartTimeAxis, ChartLinearAxis } from "../scaleBase.js";
export declare class Timeline<T> extends ChartTime {
    zoomChart: ChartTimeZoom;
    tooltip: Tooltip<this>;
    zoom: Zoom;
    transitions: Transitions;
    clicking: ClickTimeline<this>;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
    scatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom?: boolean, invisible?: boolean): void;
    protected minTimelineDate(data?: IAdminAnalyticsData[]): Date;
    protected maxTimelineDate(data?: IAdminAnalyticsData[]): Date;
}
declare class ChartTimeZoom implements IChartScales {
    x: ChartTimeAxis;
    y: ChartLinearAxis;
    constructor(chart: IChart, domain: Date[]);
}
declare class ClickTimeline<T extends Timeline<any>> extends Click<T> {
    appendScatterText(d: IReflectionAuthor, title: string, values?: ITooltipValues[]): void;
    private positionClickContainer;
}
export {};
