;
import { IAdminAnalyticsData, IReflectionAuthor, ITimelineData } from "../../data/data.js";
export declare class Users {
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    id: string;
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
    renderTabContent(data: IReflectionAuthor[]): void;
    private renderReflections;
    renderReflections1(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAdminAnalyticsData, thresholds: number[], timelineData?: ITimelineData): void;
    protected getUserStatisticBinName(data: IReflectionAuthor, thresholds: number[]): string;
}
