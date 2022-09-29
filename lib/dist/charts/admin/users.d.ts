;
import { IAdminAnalyticsData, IReflectionAuthor, ITimelineData } from "../../data/data.js";
export declare class Users {
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
    renderReflections(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAdminAnalyticsData, thresholds: number[], timelineData?: ITimelineData): void;
    protected getUserStatisticBinName(data: IReflectionAuthor, thresholds: number[]): string;
}
