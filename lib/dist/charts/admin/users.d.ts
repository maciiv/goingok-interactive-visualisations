import { IAdminAnalyticsData, IReflectionAuthor } from "../../data/data.js";
import { Sort } from "../../interactions/sort.js";
import { IGroupBy } from "../../utils/utils.js";
export declare class Users {
    id: string;
    sorted: string;
    sort: Sort;
    private _data;
    get data(): IAdminAnalyticsData[];
    set data(entries: IAdminAnalyticsData[]);
    constructor(data: IAdminAnalyticsData[]);
    render(): void;
    renderTabContent(data: IReflectionAuthor[], groupByData?: IGroupBy<IReflectionAuthor>[]): void;
    private renderReflections;
    private handleSort;
    protected getUserStatisticBinName(data: IReflectionAuthor, thresholds: number[]): string;
}
