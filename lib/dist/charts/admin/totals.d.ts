import { IAdminAnalyticsData } from "../../data/data";
export declare class Totals {
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
}
