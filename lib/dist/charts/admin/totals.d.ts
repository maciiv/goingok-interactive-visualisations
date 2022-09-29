import { IAdminAnalyticsDataStats } from "../../data/data.js";
export declare class Totals {
    private _data;
    get data(): IAdminAnalyticsDataStats[];
    set data(entries: IAdminAnalyticsDataStats[]);
    constructor(data: IAdminAnalyticsDataStats[]);
    render(): void;
}
