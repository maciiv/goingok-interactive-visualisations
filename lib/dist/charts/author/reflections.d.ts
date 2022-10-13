import { IAuthorAnalyticsData } from "../../data/data.js";
import { Sort } from "../../interactions/sort.js";
export declare class Reflections {
    id: string;
    sorted: string;
    sort: Sort;
    private _data;
    get data(): IAuthorAnalyticsData;
    set data(entries: IAuthorAnalyticsData);
    constructor(data: IAuthorAnalyticsData);
    render(): void;
    private text;
}
