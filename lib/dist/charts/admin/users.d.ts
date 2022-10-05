import { IAdminAnalyticsData, IReflectionAuthor } from "../../data/data.js";
export declare class Users {
    id: string;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
    renderTabContent(data: IReflectionAuthor[]): void;
    private renderReflections;
    protected getUserStatisticBinName(data: IReflectionAuthor, thresholds: number[]): string;
}
