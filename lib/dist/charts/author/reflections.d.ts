import { INodes, IReflectionAnalytics } from "../../data/data";
import { Sort } from "../../interactions/sort";
export declare class Reflections {
    id: string;
    sort: Sort<IReflectionAnalytics>;
    extend?: Function;
    private _nodes;
    get nodes(): INodes[];
    set nodes(nodes: INodes[]);
    private _data;
    get data(): IReflectionAnalytics[];
    set data(entries: IReflectionAnalytics[]);
    constructor(data: IReflectionAnalytics[]);
    render(): void;
    private text;
    private fillNodesText;
    private handleSort;
}
