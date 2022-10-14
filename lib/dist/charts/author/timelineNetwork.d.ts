import { IReflectionAnalytics } from "../../data/data.js";
import { Click } from "../../interactions/click.js";
import { Tooltip } from "../../interactions/tooltip.js";
import { ChartTime, ExtendChart } from "../chartBase.js";
export declare class TimelineNetwork<T> extends ChartTime {
    tooltip: Tooltip;
    clicking: Click;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IReflectionAnalytics[];
    set data(entries: IReflectionAnalytics[]);
    constructor(data: IReflectionAnalytics[]);
    render(): void;
    private renderReflectionNetwork;
    private simulation;
}
