import { IAdminAnalyticsData } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { ChartSeries } from "../chartBase";
export declare class BarChart extends ChartSeries {
    tooltip: Tooltip<this>;
    clicking: Click<this>;
    extend?: Function;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
}
