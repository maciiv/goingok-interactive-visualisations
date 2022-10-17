import d3 from "d3"

interface IChartAxis {
    scale: d3.ScaleBand<string> | d3.ScaleLinear<number, number, never> | d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    transition(data: string[] | number[] | Date[]): void
}

export class ChartSeriesAxis implements IChartAxis {
    protected id: string
    scale: d3.ScaleBand<string>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    constructor(id: string, label: string, domain: string[], range: number[], position?: string) {
        this.id = id
        this.label = label;
        this.scale = d3.scaleBand()
            .domain(domain)
            .rangeRound(range)
            .padding(0.25);
            if (position == "right") {
                this.axis = d3.axisRight(this.scale);
            } else if (position == "left") {
                this.axis = d3.axisLeft(this.scale);
            } else {
                this.axis = d3.axisBottom(this.scale);
            }
    }
    transition(data: string[]) {
        this.scale.domain(data)
        d3.select<SVGGElement, unknown>(`#${this.id} .x-axis`).transition()
            .duration(750)
            .call(this.axis);
    };
}

export class ChartLinearAxis implements IChartAxis {
    protected id: string
    scale: d3.ScaleLinear<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    constructor(id:string, label: string, domain: number[], range: number[], position?: string, isGoingOk: boolean = true) {
        this.id = id
        this.label = label;
        this.scale = d3.scaleLinear()
            .domain([d3.min(domain) < 0 ? d3.min(domain) : 0, d3.max(domain)])
            .range(range);
        if (position == "right") {
            this.axis = d3.axisRight(this.scale);
        } else if (position == "bottom") {
            this.axis = d3.axisBottom(this.scale);
        } else {
            this.axis = d3.axisLeft(this.scale);
        }
        if (isGoingOk) {
            let labels: Map<number | d3.AxisDomain, string> = new Map();
            labels.set(0, "distressed");
            labels.set(50, "going ok");
            labels.set(100, "soaring");
            this.axis.tickValues([0, 25, 50, 75, 100])
                .tickFormat(d => labels.get(d));
        }
    }
    transition(data: number[]): void {
        this.scale.domain(data)
        d3.select<SVGGElement, unknown>(`#${this.id} .y-axis`).transition()
            .duration(750)
            .call(this.axis);
    };
    setThresholdAxis(tDistressed: number, tSoaring: number) : d3.Axis<d3.NumberValue> {
        return d3.axisRight(this.scale)
            .tickValues([tDistressed, tSoaring])
            .tickFormat(d => d == tDistressed ? "Distressed" : d == tSoaring ? "Soaring" : "");
    }
}

export class ChartTimeAxis implements IChartAxis {
    protected id: string
    scale: d3.ScaleTime<number, number, never>;
    axis: d3.Axis<d3.AxisDomain>;
    label: string;
    constructor(id: string, label: string, domain: Date[], range: number[]) {
        this.id = id
        this.label = label;
        this.scale = d3.scaleTime()
            .domain(d3.extent(domain))
            .range(range);
        this.axis = d3.axisBottom(this.scale)
    }
    transition(data: Date[]): void {
        this.scale.domain(data);
        d3.select<SVGGElement, unknown>(`#${this.id} .x-axis`).transition()
            .duration(750)
            .call(this.axis);
    };
}