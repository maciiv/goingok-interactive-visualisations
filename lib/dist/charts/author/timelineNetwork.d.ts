import { IReflectionAnalytics } from "../../data/data";
import { Click } from "../../interactions/click";
import { Tooltip } from "../../interactions/tooltip";
import { ChartTime } from "../chartBase";
export declare class TimelineNetwork extends ChartTime {
    tooltip: Tooltip<this>;
    clicking: ClickTimelineNetwork<this>;
    extend?: Function;
    private _data;
    get data(): IReflectionAnalytics[];
    set data(entries: IReflectionAnalytics[]);
    constructor(data: IReflectionAnalytics[]);
    render(): Promise<void>;
    private getLines;
    private renderReflectionNetwork;
    private simulation;
}
declare class ClickTimelineNetwork<T extends TimelineNetwork> extends Click<T> {
    removeClick(): void;
}
export {};
