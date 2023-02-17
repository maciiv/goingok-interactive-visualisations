interface IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>;
    axis: d3.Axis<string> | d3.Axis<d3.NumberValue> | d3.Axis<d3.NumberValue | Date>;
    label: string;
    transition(data: string[] | number[] | Date[]): void;
    withinRange(x: number): number;
}
export declare class ChartSeriesAxis implements IChartAxis {
    id: string;
    scale: d3.ScaleBand<string>;
    axis: d3.Axis<string>;
    label: string;
    constructor(id: string, label: string, domain: string[], range: number[], position?: string);
    setScale(domain: string[], range: number[]): d3.ScaleBand<string>;
    setAxis(scale: d3.ScaleBand<string>, position?: string): d3.Axis<string>;
    transition(data: string[]): void;
    withinRange(x: number): number;
}
export declare class ChartLinearAxis implements IChartAxis {
    id: string;
    scale: d3.ScaleLinear<number, number, never>;
    axis: d3.Axis<d3.NumberValue>;
    label: string;
    constructor(id: string, label: string, domain: number[], range: number[], position?: string, isGoingOk?: boolean);
    setScale(domain: number[], range: number[]): d3.ScaleLinear<number, number, never>;
    getMinDomain(domain: number[]): number;
    setAxis(scale: d3.ScaleLinear<number, number, never>, position?: string): d3.Axis<d3.NumberValue>;
    transition(data: number[]): void;
    withinRange(x: number): number;
    setThresholdAxis(tDistressed: number, tSoaring: number): d3.Axis<d3.NumberValue>;
}
export declare class ChartTimeAxis implements IChartAxis {
    id: string;
    scale: d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.NumberValue | Date>;
    label: string;
    constructor(id: string, label: string, domain: Date[], range: number[]);
    setScale(domain: Date[], range: number[]): d3.ScaleTime<number, number, never>;
    transition(data: Date[]): void;
    withinRange(x: number): number;
}
export {};
