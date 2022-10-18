import { IReflectionAnalytics } from "../../data/data.js";
import { Sort } from "../../interactions/sort.js";
import { ExtendChart } from "../chartBase.js";
export declare class Reflections<T> {
    id: string;
    sorted: string;
    sort: Sort;
    dashboard?: T;
    extend?: ExtendChart<T>;
    private _data;
    get data(): IReflectionAnalytics[];
    set data(entries: IReflectionAnalytics[]);
    constructor(data: IReflectionAnalytics[]);
    render(): void;
    private text;
    private handleSort;
}
