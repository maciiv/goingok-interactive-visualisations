import { IReflectionAnalytics } from "../../data/data.js";
import { Sort } from "../../interactions/sort.js";
export declare class Reflections {
    id: string;
    sort: Sort<IReflectionAnalytics>;
    extend?: Function;
    private _data;
    get data(): IReflectionAnalytics[];
    set data(entries: IReflectionAnalytics[]);
    constructor(data: IReflectionAnalytics[]);
    render(): void;
    private text;
    private handleSort;
}
