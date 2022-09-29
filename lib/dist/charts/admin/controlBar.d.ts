import { IAdminAnalyticsDataStats } from "../../data/data.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { ChartSeries } from "../chartBase.js";
export declare class ControlBarChart extends ChartSeries {
    data: IAdminAnalyticsDataStats[];
    tooltip: Tooltip;
    constructor(data: IAdminAnalyticsDataStats[]);
    render(): void;
}
