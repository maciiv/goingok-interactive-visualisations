import { IDataStats } from "../data/data";
import { IChart } from "../charts/chartBase";

type ClickFunction = {
    (this: SVGRectElement | SVGCircleElement | SVGPathElement | d3.BaseType, event: MouseEvent, d: unknown): void
}

type ClickTextData = {
    clickData: {stat: IDataStats | number, group: string};
    data: {stat: IDataStats | number, group: string};
}

export interface IClick {
    enableClick(onClick: any): void;
    removeClick(): void;
}

export class Click<T extends IChart> implements IClick {
    clicked: boolean
    protected chart: T
    constructor(chart: T) {
        this.chart = chart
    }
    enableClick(onClick: ClickFunction): void {
        this.chart.elements.content.on("click", onClick)
    };
    removeClick(): void {
        this.clicked = false
        this.chart.elements.contentContainer.selectAll(".click-text").remove()
        this.chart.elements.contentContainer.selectAll(".click-line").remove()
        this.chart.elements.contentContainer.selectAll(".click-container").remove()
        this.chart.elements.content.classed("clicked", false)
        this.chart.elements.content.classed("not-clicked", false)
        this.chart.elements.content.classed("main", false)
    };
    protected comparativeText(textData: ClickTextData): string[] {
        let textClass = "click-text";
        let textSymbol = "";
        let textValue;
        if (typeof(textData.clickData.stat) != "number" && typeof(textData.data.stat) != "number") {
            textValue = (textData.clickData.stat.value as number) - (textData.data.stat.value as number)
        } else {
            textValue = (textData.clickData.stat as number) - (textData.data.stat as number)
        }

        if (textValue < 0) {
            textClass = textClass + " positive";
            textSymbol = "+";
        }
        else if (textValue > 0) {
            textClass = textClass + " negative";
            textSymbol = "-";
        }
        else {
            textClass = textClass + " black"
        }

        if (textData.clickData.group != null && textData.data.group != null) {
            return [textClass, `${textSymbol}${textData.clickData.group == textData.data.group 
                && textValue == 0 ? typeof(textData.clickData.stat) != "number" ? textData.clickData.stat.value : textData.clickData.stat : (Math.abs(textValue))}`];
        } else {
            return [textClass, `${textSymbol}${(Math.abs(textValue))}`];
        }
    }
}