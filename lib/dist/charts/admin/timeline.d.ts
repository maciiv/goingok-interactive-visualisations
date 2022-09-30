;
import { IAdminAnalyticsData } from "../../data/data.js";
import { ClickAdmin } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { Zoom } from "../../interactions/zoom.js";
import { ChartTime, ChartTimeZoom } from "../chartBase.js";
export declare class Timeline extends ChartTime {
    zoomChart: ChartTimeZoom;
    tooltip: Tooltip;
    zoom: Zoom;
    transitions: Transitions;
    clicking: ClickAdmin;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
    scatter(update: d3.Selection<SVGGElement, IAdminAnalyticsData, SVGGElement, unknown>, chart: ChartTime | ChartTimeZoom, zoom?: boolean, invisible?: boolean): void;
    protected minTimelineDate(data?: IAdminAnalyticsData[]): Date;
    protected maxTimelineDate(data?: IAdminAnalyticsData[]): Date;
}
