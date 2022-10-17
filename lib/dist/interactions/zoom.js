;
export class Zoom {
    enableZoom(chart, zoomed) {
        chart.elements.svg.selectAll(".zoom-rect")
            .attr("class", "zoom-rect active");
        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .extent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .translateExtent([[0, 0], [chart.width - chart.padding.yAxis, chart.height]])
            .on("zoom", zoomed);
        chart.elements.contentContainer.select(".zoom-rect").call(zoom);
    }
    ;
    appendZoomBar(chart) {
        return chart.elements.svg.append("g")
            .attr("id", "zoom-container")
            .attr("class", "zoom-container")
            .attr("height", 30)
            .attr("width", chart.width - chart.padding.yAxis)
            .attr("transform", `translate(${chart.padding.yAxis}, ${chart.height - 30})`);
    }
    ;
}
