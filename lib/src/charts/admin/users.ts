import d3 from "d3";
import { IAdminAnalyticsData, IReflectionAuthor, ITimelineData, UserChartData } from "../../data/data.js";
import { UserChart } from "../chartBase.js";

export class Users {
    data: IAdminAnalyticsData
    renderUserStatistics(card: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>, data: IAdminAnalyticsData, thresholds: number[], timelineData?: ITimelineData): void {
        let _this = this;
        let usersData = data.getUsersData();

        d3.select("#reflections .card-subtitle")
            .classed("text-muted", true)
            .classed("instructions", false)
            .html(timelineData == undefined ? `The user ${usersData.value[d3.minIndex(usersData.value.map(d => d.point))].pseudonym} is the most distressed, while
                the user ${usersData.value[d3.maxIndex(usersData.value.map(d => d.point))].pseudonym} is the most soaring` :
                `The user ${timelineData.pseudonym} has a total of ${data.value.filter(d => d.pseudonym == timelineData.pseudonym).length} reflections between
                ${d3.min(data.value.filter(d => d.pseudonym == timelineData.pseudonym).map(d => d.timestamp)).toDateString()} and
                ${d3.max(data.value.filter(d => d.pseudonym == timelineData.pseudonym).map(d => d.timestamp)).toDateString()}`)

        card.selectAll("div")
            .data(timelineData == undefined ? usersData.value : usersData.value.filter(d => d.pseudonym == timelineData.pseudonym))
            .enter()
            .append("div")
            .attr("class", "row statistics-text")
            .attr("id", d => d.pseudonym)
            .call(div => div.append("div")
                .attr("class", "col-md-4")
                .call(div => div.append("h5")
                    .attr("class", "mb-0 mt-1")
                    .html(d => `${d.pseudonym} is`))
                .call(div => div.append("span")
                    .attr("class", d => `bin-name ${_this.getUserStatisticBinName(d, thresholds).toLowerCase()}`)
                    .html(d => `<b>${_this.getUserStatisticBinName(d, thresholds)}</b>`))
                .call(div => div.append("div")
                    .attr("class", "mt-2")
                    .append("h6")
                    .html("Percentage of reflections"))
                .call(div => div.append("div")
                    .attr("class", "w-100 mt-1 user-chart")))
            .call(div => div.append("div")
                .attr("class", "col-md-8")
                .append("p")
                .attr("class", "mb-1")
                .html(d => `User ${d.pseudonym} reflections in chronological order:`)
                .call(div => div.append("ul")
                    .attr("class", "pr-3")
                    .selectAll("li")
                    .data(d => d3.sort(d3.filter(data.value, x => x.pseudonym == d.pseudonym), r => r.timestamp))
                    .enter()
                    .append("li")
                    .classed("reflection-selected", d => timelineData != undefined ? d.timestamp == timelineData.timestamp : false)
                    .html(d => `<i>${d.timestamp.toDateString()} | Reflection point ${d.point}</i><br> ${d.text}`)))
            .each((d, i, g) => drawUserChart(d3.select(d3.select(g[i]).node().parentElement).attr("id") + " #" + d3.select(g[i]).attr("id"), d.pseudonym, thresholds));

        function drawUserChart(id: string, pseudonym: string, thresholds: number[]) {          
            let chart = new UserChart(id, "user-chart");
            let bin = d3.bin().domain([0, 100]).thresholds(thresholds);
            let userData = data.value.filter(d => d.pseudonym == pseudonym);
            let userChartData = bin(usersData.value.map(d => d.point)).map(c => { return new UserChartData(c, usersData.value, Math.round(c.length / usersData.value.length * 100), true) });
            userChartData.push(...bin(userData.map(d => d.point)).map(c => { return new UserChartData(c, userData, Math.round(c.length / userData.length * 100), false) }));
    
            chart.elements.svg.classed("chart-svg", false);
            chart.elements.svg.select(".x-axis").attr("clip-path", null);
            chart.elements.contentContainer.selectAll("circle")
                .data(userChartData)
                .enter()
                .append("circle")
                .attr("class", d => d.isGroup ? "circle-group" : "circle-user")
                .attr("r", 5)
                .attr("cx", d => chart.x.scale(d.percentage))
                .attr("cy", d => chart.y.scale(d.binName) + chart.y.scale.bandwidth() / 2)
                .attr("fill", usersData.colour)
                .attr("stroke", usersData.colour);
            chart.elements.contentContainer.selectAll("line")
                .data(d3.group(userChartData, d => d.binName))
                .enter()
                .append("line")
                .attr("class", "line-user")
                .attr("x1", d => chart.x.scale(d3.min(d[1].map(c => c.percentage))))
                .attr("x2", d => chart.x.scale(d3.max(d[1].map(c => c.percentage))))
                .attr("y1", d => chart.y.scale(d[0]) + chart.y.scale.bandwidth() / 2)
                .attr("y2", d => chart.y.scale(d[0]) + chart.y.scale.bandwidth() / 2)
                .attr("stroke", usersData.colour);
            chart.elements.svg.append("g")
                .attr("class", "user-legend-container")
                .attr("transform", `translate(${(chart.width - chart.padding.xAxis - chart.padding.right) / 2}, ${chart.height - 15})`)
                .selectAll("g")
                .data([usersData.group, pseudonym])
                .enter()
                .append("g")
                .attr("class", "user-legend")
                .call(g => g.append("rect")
                    .attr("class", (d, i) => i == 0 ? "circle-group" : "circle-user")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("height", 10)
                    .attr("width", 10)
                    .attr("fill", usersData.colour)
                    .attr("stroke", usersData.colour))
                .call(g => g.append("text")
                    .attr("class", "user-legend-text")
                    .attr("x", 15)
                    .attr("y", 5)
                    .text(d => d));
            chart.elements.svg.selectAll<SVGGElement, string[]>(".user-legend")
                .attr("transform", (d, i, g) => `translate(${i == 0 ? 0 : d3.select(g[i - 1]).node().getBoundingClientRect().width + 20}, 0)`);
        }
    };
    protected getUserStatisticBinName(data: IReflectionAuthor, thresholds: number[]): string {
        let distressed = thresholds[0];
        let soaring = thresholds[1];
        if (data.point <= distressed) {
            return "Distressed";
        } else if (data.point >= soaring) {
            return "Soaring";
        } else {
            return "GoingOK";
        }
    }
}