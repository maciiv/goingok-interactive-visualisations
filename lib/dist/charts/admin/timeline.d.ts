import { IAdminAnalyticsData, IReflectionAuthor } from "../../data/data";
import { Click } from "../../interactions/click";
import { ITooltipValues, Tooltip } from "../../interactions/tooltip";
import { Zoom } from "../../interactions/zoom";
import { ChartTime, IChart, IChartScales } from "../chartBase";
import { ChartTimeAxis, ChartLinearAxis } from "../scaleBase";
export declare class Timeline extends ChartTime {
    zoomChart: ChartTimeZoom;
    tooltip: Tooltip<this>;
    zoom: Zoom<this>;
    clicking: ClickTimeline<this>;
    extend?: Function;
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
declare class ClickTimeline<T extends Timeline> extends Click<T> {
    removeClick(): void;
    appendScatterText(d: IReflectionAuthor, title: string, values?: ITooltipValues[]): void;
    private positionClickContainer;
}
export {};
