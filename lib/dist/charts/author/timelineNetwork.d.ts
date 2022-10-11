import { IAuthorAnalyticsData, IReflectionAnalytics } from "../../data/data.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { ChartTime } from "../chartBase.js";
export declare class TimelineNetwork extends ChartTime {
    tooltip: Tooltip;
    analytics: IReflectionAnalytics;
    private _data;
    get data(): IAuthorAnalyticsData;
    set data(entries: IAuthorAnalyticsData);
    constructor(data: IAuthorAnalyticsData);
    render(): void;
    private renderReflectionNetwork;
    private simulation;
}
