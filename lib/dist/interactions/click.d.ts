import { IClickTextData } from "../data/data.js";
import { IChart } from "../charts/chartBase.js";
export interface IClick {
    enableClick(onClick: any): void;
    removeClick(): void;
}
export declare class Click<T extends IChart> implements IClick {
    protected chart: T;
    constructor(chart: T);
    enableClick(onClick: any): void;
    removeClick(): void;
    protected comparativeText(textData: IClickTextData): string[];
}
