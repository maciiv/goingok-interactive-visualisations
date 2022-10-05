import { ClickTextData } from "../data/data.js";
export class Click {
    enableClick(chart, onClick) {
        chart.elements.content.on("click", onClick);
    }
    ;
    removeClick(chart) {
        chart.click = false;
        chart.elements.contentContainer.selectAll(".click-text").remove();
        chart.elements.contentContainer.selectAll(".click-line").remove();
        chart.elements.contentContainer.selectAll(".click-container").remove();
        chart.elements.content.classed("clicked", false);
        chart.elements.content.classed("main", false);
    }
    ;
}
export class ClickAdmin extends Click {
    appendScatterText(chart, d, title, values = null) {
        let container = chart.elements.contentContainer.append("g")
            .datum(d)
            .attr("class", "click-container");
        let box = container.append("rect")
            .attr("class", "click-box");
        let text = container.append("text")
            .attr("class", "click-text title")
            .attr("x", 10)
            .text(title);
        let textSize = text.node().getBBox().height;
        text.attr("y", textSize);
        if (values != null) {
            values.forEach((c, i) => {
                text.append("tspan")
                    .attr("class", "click-text")
                    .attr("y", textSize * (i + 2))
                    .attr("x", 15)
                    .text(`${c.label}: ${c.value}`);
            });
        }
        box.attr("width", text.node().getBBox().width + 20)
            .attr("height", text.node().getBBox().height + 5)
            .attr("clip-path", `url(#clip-${chart.id})`);
        container.attr("transform", this.positionClickContainer(chart, box, text, d));
    }
    ;
    positionClickContainer(chart, box, text, d) {
        let positionX = chart.x.scale(d.timestamp);
        let positionY = chart.y.scale(d.point) - box.node().getBBox().height - 10;
        if (chart.width - chart.padding.yAxis < chart.x.scale(d.timestamp) + text.node().getBBox().width) {
            positionX = chart.x.scale(d.timestamp) - box.node().getBBox().width;
        }
        ;
        if (chart.y.scale(d.point) - box.node().getBBox().height - 10 < 0) {
            positionY = positionY + box.node().getBBox().height + 20;
        }
        ;
        return `translate(${positionX}, ${positionY})`;
    }
    ;
    appendGroupsText(chart, data, clickData) {
        chart.elements.content.classed("clicked", (d) => d.group == clickData.group);
        chart.elements.contentContainer.selectAll(".click-container")
            .data(data)
            .join(enter => enter.append("g")
            .attr("class", "click-container")
            .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`)
            .call(enter => enter.selectAll("text")
            .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
            .enter()
            .append("text")
            .attr("class", "click-text black")
            .attr("y", c => chart.y.scale(c.data.stat.value) - 5)
            .text(c => `${c.data.stat.displayName}: ${c.data.stat.value} `)
            .append("tspan")
            .attr("class", c => this.comparativeText(c)[0])
            .text(c => c.data.group != clickData.group ? `(${this.comparativeText(c)[1]})` : "")), update => update.call(update => update.transition()
            .duration(750)
            .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
            .call(update => update.selectAll("text")
            .data(c => c.stats.filter(d => d.stat == "q3" || d.stat == "median" || d.stat == "q1").map(d => new ClickTextData(clickData.stats.find(a => a.stat == d.stat), d, clickData.group, c.group)))
            .join(enter => enter, update => update.attr("y", c => chart.y.scale(c.data.stat.value) - 5)
            .text(c => `${c.data.stat.displayName}: ${c.data.stat.value} `)
            .append("tspan")
            .attr("class", c => this.comparativeText(c)[0])
            .text(c => c.data.group != clickData.group ? `(${this.comparativeText(c)[1]})` : ""), exit => exit)), exit => exit.remove());
    }
    ;
    appendThresholdPercentages(chart, data, clickData) {
        let thresholds = chart.elements.getThresholdsValues(chart);
        let tDistressed = thresholds[0];
        let tSoaring = thresholds[1];
        chart.elements.content.classed("clicked", (d) => d.group == clickData.group && clickData.bin.length - d.bin.length == 0);
        chart.elements.contentContainer.selectAll(".click-container")
            .data(data)
            .join(enter => enter.append("g")
            .attr("class", "click-container")
            .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`)
            .call(enter => enter.selectAll("text")
            .data(d => chart.getBinData(d))
            .enter()
            .append("text")
            .attr("class", "click-text black")
            .attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
            .text(c => `${c.percentage}% `)
            .append("tspan")
            .attr("class", c => this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[0])
            .text(c => c.group != clickData.group && c.bin.x0 == clickData.bin.x0 && c.bin.x1 == clickData.bin.x1 ? `(${this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[1]})` : "")), update => update.call(update => update.transition()
            .duration(750)
            .attr("transform", c => `translate(${chart.x.scale(c.group) + chart.x.scale.bandwidth() / 2}, 0)`))
            .call(update => update.selectAll("text")
            .data(d => chart.getBinData(d))
            .join(enter => enter, update => update.attr("y", c => c.bin.x0 == 0 ? chart.y.scale(0 + tDistressed / 2) : c.bin.x1 == 100 ? chart.y.scale(tSoaring + (100 - tSoaring) / 2) : chart.y.scale(50))
            .text(c => `${c.percentage}% `)
            .append("tspan")
            .attr("class", c => this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[0])
            .text(c => c.group != clickData.group && c.bin.x0 == clickData.bin.x0 && c.bin.x1 == clickData.bin.x1 ? `(${this.comparativeText(new ClickTextData(clickData.percentage, c.percentage, clickData.group, c.group))[1]})` : ""), exit => exit)), exit => exit.remove());
    }
    ;
    comparativeText(textData) {
        let textClass = "click-text";
        let textSymbol = "";
        let textValue;
        if (typeof (textData.clickData.stat) != "number" && typeof (textData.data.stat) != "number") {
            textValue = textData.clickData.stat.value - textData.data.stat.value;
        }
        else {
            textValue = textData.clickData.stat - textData.data.stat;
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
            textClass = textClass + " black";
        }
        if (textData.clickData.group != null && textData.data.group != null) {
            return [textClass, `${textSymbol}${textData.clickData.group == textData.data.group
                    && textValue == 0 ? typeof (textData.clickData.stat) != "number" ? textData.clickData.stat.value : textData.clickData.stat : (Math.abs(textValue))}`];
        }
        else {
            return [textClass, `${textSymbol}${(Math.abs(textValue))}`];
        }
    }
}