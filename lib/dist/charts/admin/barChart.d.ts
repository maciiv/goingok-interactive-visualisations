import { IAdminAnalyticsData } from "../../data/data.js";
import { ClickAdmin } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { ChartSeries, ExtendChart } from "../chartBase.js";
export declare class BarChart<T> extends ChartSeries {
    tooltip: Tooltip;
    transitions: Transitions;
    clicking: ClickAdmin<unknown>;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
}
