import { IDataStats } from "../data/data";
import { IChart } from "../charts/chartBase";
type ClickFunction = {
    (this: SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, event: MouseEvent, d: unknown): void;
};
type ClickTextData = {
    clickData: {
        stat: IDataStats | number;
        group: string;
    };
    data: {
        stat: IDataStats | number;
        group: string;
    };
};
export interface IClick {
    enableClick(onClick: any): void;
    removeClick(): void;
}
export declare class Click<T extends IChart> implements IClick {
    clicked: boolean;
    protected chart: T;
    constructor(chart: T);
    enableClick(onClick: ClickFunction): void;
    removeClick(): void;
    protected comparativeText(textData: ClickTextData): string[];
}
export {};
