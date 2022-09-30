import { IAdminAnalyticsDataStats } from "../../data/data.js";
import { ClickAdmin } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { ChartSeries, ExtendChart } from "../chartBase.js";
export declare class BarChart<T> extends ChartSeries {
    private _data;
    get data(): IAdminAnalyticsDataStats[];
    set data(entries: IAdminAnalyticsDataStats[]);
    tooltip: Tooltip;
    transitions: Transitions;
    clicking: ClickAdmin;
    dashboard?: T;
    extend?: ExtendChart<T>;
    constructor(data: IAdminAnalyticsDataStats[]);
    render(): void;
}
