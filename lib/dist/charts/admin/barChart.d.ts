import { IAdminAnalyticsData } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { Transitions } from "../../interactions/transitions.js";
import { ChartSeries, ExtendChart } from "../chartBase.js";
export declare class BarChart<T> extends ChartSeries {
    tooltip: Tooltip<this>;
    transitions: Transitions;
    clicking: ClickBarChart<this>;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
}
declare class ClickBarChart<T extends BarChart<any>> extends Click<T> {
    constructor(chart: T);
    appendGroupsText(data: IAdminAnalyticsData[], clickData: IAdminAnalyticsData): void;
}
export {};
