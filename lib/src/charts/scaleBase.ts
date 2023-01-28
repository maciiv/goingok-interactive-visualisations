import { scaleBand, axisRight, axisLeft, axisBottom, select, scaleLinear, extent, scaleTime } from "d3"

interface IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>
    axis: d3.Axis<string> | d3.Axis<d3.NumberValue> | d3.Axis<d3.NumberValue | Date>
    label: string
    transition(data: string[] | number[] | Date[]): void
    withinRange(x: number): number
}

export class ChartSeriesAxis implements IChartAxis {
    id: string
    scale: d3.ScaleBand<string>
    axis: d3.Axis<string>
    label: string
    constructor(id: string, label: string, domain: string[], range: number[], position?: string) {
        this.id = id
        this.label = label
        this.scale = this.setScale(domain, range)
        this.axis = this.setAxis(this.scale, position)
    }
    setScale(domain: string[], range: number[]): d3.ScaleBand<string> {
        return scaleBand()
            .domain(domain)
            .rangeRound(range)
            .padding(0.25)
    }
    setAxis(scale: d3.ScaleBand<string>, position?: string): d3.Axis<string> {
        switch (position) {
            case "right":
                return axisRight(scale)
            case "left":
                return axisLeft(scale)
            default:
                return axisBottom(scale) 
        }

    }
    transition(data: string[]): void {
        this.scale.domain(data)
        select<SVGGElement, unknown>(`#${this.id} .x-axis`).transition()
            .duration(750)
            .call(this.axis);
    }
    withinRange(x: number): number {
        const range = this.scale.range()
        const min = Math.min.apply(null, range)
        const max = Math.max.apply(null, range)
        return x < min ? min : x > max ? max : x
    }
}

export class ChartLinearAxis implements IChartAxis {
    id: string
    scale: d3.ScaleLinear<number, number, never>
    axis: d3.Axis<d3.NumberValue>
    label: string
    constructor(id:string, label: string, domain: number[], range: number[], position?: string, isGoingOk: boolean = true) {
        this.id = id
        this.label = label
        this.scale = this.setScale(domain, range)
        this.axis = this.setAxis(this.scale, position)
        if (isGoingOk) {
            let labels: Map<number | d3.AxisDomain, string> = new Map()
            labels.set(0, "distressed")
            labels.set(50, "going ok")
            labels.set(100, "soaring")
            this.axis.tickValues([0, 25, 50, 75, 100])
                .tickFormat(d => labels.get(d))
        }
    }
    setScale(domain: number[], range: number[]): d3.ScaleLinear<number, number, never> {
        return scaleLinear()
            .domain([this.getMinDomain(domain), Math.max.apply(null, domain)])
            .range(range)
    }
    getMinDomain(domain: number[]): number {
        return Math.min.apply(null, domain) < 0 ? 0 : Math.min.apply(null, domain)
    }
    setAxis(scale: d3.ScaleLinear<number, number, never>, position?: string): d3.Axis<d3.NumberValue> {
        switch (position) {
            case "right":
                return axisRight(scale)
            case "bottom":
                return axisBottom(scale) 
            default:
                return axisLeft(scale)
        }

    }
    transition(data: number[]): void {
        this.scale.domain(data)
        select<SVGGElement, unknown>(`#${this.id} .y-axis`).transition()
            .duration(750)
            .call(this.axis);
    }
    withinRange(x: number): number {
        const range = this.scale.range()
        const min = Math.min.apply(null, range)
        const max = Math.max.apply(null, range)
        return x < min ? min : x > max ? max : x
    }
    setThresholdAxis(tDistressed: number, tSoaring: number) : d3.Axis<d3.NumberValue> {
        return axisRight(this.scale)
            .tickValues([tDistressed, tSoaring])
            .tickFormat(d => d == tDistressed ? "Distressed" : d == tSoaring ? "Soaring" : "");
    }
}

export class ChartTimeAxis implements IChartAxis {
    id: string
    scale: d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.NumberValue | Date>;
    label: string;
    constructor(id: string, label: string, domain: Date[], range: number[]) {
        this.id = id
        this.label = label;
        this.scale = this.setScale(domain, range)
        this.axis = axisBottom(this.scale)
    }
    setScale(domain: Date[], range: number[]): d3.ScaleTime<number, number, never> {
        return scaleTime()
            .domain(extent(domain))
            .range(range)
    }
    transition(data: Date[]): void {
        this.scale.domain(data)
        select<SVGGElement, unknown>(`#${this.id} .x-axis`).transition()
            .duration(750)
            .call(this.axis)
    }
    withinRange(x: number): number {
        const range = this.scale.range()
        const min = Math.min.apply(null, range)
        const max = Math.max.apply(null, range)
        return x < min ? min : x > max ? max : x
    }
}