import { addDays } from "../utils/utils.js";
import { ChartTime, ChartPadding } from "./chartBase.js";

export class ChartTimeNetwork extends ChartTime {
    constructor(id: string, domain: Date[], chartPadding: ChartPadding){
        super(id, domain, chartPadding);
        this.x.scale.domain([addDays(new Date(Math.min.apply(null, domain)), -30), addDays(Math.max.apply(null, domain), 30)]);
        this.elements.xAxis.call(this.x.axis);
    }
}