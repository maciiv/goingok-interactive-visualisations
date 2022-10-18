;
export class Zoom {
    constructor(chart) {
        this.chart = chart;
    }
    enableZoom(zoomed) {
        this.chart.elements.svg.selectAll(".zoom-rect")
            .attr("class", "zoom-rect active");
        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[0, 0], [this.chart.width - this.chart.padding.yAxis, this.chart.height]])
            .translateExtent([[0, 0], [this.chart.width - this.chart.padding.yAxis, this.chart.height]])
            .on("zoom", zoomed);
        this.chart.elements.contentContainer.select(".zoom-rect").call(zoom);
    }
    ;
    appendZoomBar() {
        return this.chart.elements.svg.append("g")
            .attr("id", "zoom-container")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", this.chart.width - this.chart.padding.yAxis)
            .attr("transform", `translate(${this.chart.padding.yAxis}, ${this.chart.height - 30})`);
    }
    ;
}
