;
import { Sort } from "../../interactions/sort.js";
import { calculateMean, groupBy, maxDate, minDate } from "../../utils/utils.js";
export class Users {
    constructor(data) {
        this.sorted = "name";
        this.sort = new Sort();
        this.id = "reflections";
        this.data = data;
    }
    get data() {
        return this._data;
    }
    set data(entries) {
        this._data = entries.filter(d => d.selected);
        this.render();
    }
    render() {
        const _this = this;
        d3.select(`#${_this.id} .nav.nav-tabs`).selectAll("li")
            .data(_this.data)
            .join(enter => enter.append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", (d, i) => `nav-link ${i == 0 ? "active" : ""}`)
            .html(d => d.group)
            .on("click", function (e, d) {
            d3.select(`#${_this.id} .nav.nav-tabs`).selectAll("a")
                .classed("active", false);
            d3.select(this).classed("active", true);
            setTimeout(() => _this.renderTabContent(d.value));
        }), update => update.select("a")
            .classed("active", (d, i) => i == 0)
            .html(d => d.group), exit => exit.remove());
        _this.handleSort(_this.data[0].value);
        _this.renderTabContent(_this.data[0].value);
    }
    renderTabContent(data, groupByData) {
        const _this = this;
        const usersStats = groupBy(data, "pseudonym").map(d => {
            return {
                "pseudonym": d.key,
                "mean": calculateMean(d.value.map(c => c.point)),
                "total": d.value.length,
                "minDate": minDate(d.value.map(c => c.timestamp)),
                "maxDate": maxDate(d.value.map(c => c.timestamp))
            };
        });
        const minUser = usersStats.sort((a, b) => a.mean - b.mean)[0];
        const maxUser = usersStats.sort((a, b) => a.mean - b.mean)[usersStats.length - 1];
        d3.select(`#${_this.id} .text-muted`)
            .html(usersStats.length === 1 ? `The user ${usersStats[0].pseudonym} has a total of ${usersStats[0].total} reflections between
                ${usersStats[0].minDate.toDateString()} and ${usersStats[0].maxDate.toDateString()}` :
            `The user ${minUser.pseudonym} is the most distressed, while the user ${maxUser.pseudonym} is the most soaring`);
        d3.select(`#${_this.id} .tab-content`)
            .selectAll("div .statistics-text")
            .data(groupByData === undefined ? d3.sort(groupBy(data, "pseudonym"), c => c.key) : groupByData)
            .join(enter => enter.append("div")
            .attr("class", "row statistics-text")
            .attr("id", d => d.key)
            .call(div => div.append("div")
            .attr("class", "col-md-4")
            .call(div => div.append("h5")
            .attr("class", "mb-0 mt-1")
            .html(d => `${d.key} is`))
            .call(div => div.append("span")
            .attr("class", d => `bin-name`)
            .html(d => `<b></b>`))
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
            .call(p => p.append("span")
            .html(d => `User ${d.key} reflections in chronological order:`))
            .call(p => p.append("ul")
            .attr("class", "pr-3")
            .call(ul => _this.renderReflections(ul)))), update => update.attr("id", d => d.key)
            .call(update => update.select("h5")
            .html(d => `${d.key} is`))
            .call(update => update.select("p span")
            .html(d => `User ${d.key} reflections in chronological order:`))
            .call(update => _this.renderReflections(update.select("p ul"))), exit => exit.remove());
    }
    renderReflections(update) {
        update.selectAll("li")
            .data(d => d3.sort(d.value, r => r.timestamp))
            .join(enter => enter.append("li")
            .classed("reflection-selected", d => d.selected)
            .html(d => `<i>${d.timestamp.toDateString()} | Reflection state point ${d.point}</i><br> ${d.text}`), update => update.classed("reflection-selected", d => d.selected)
            .html(d => `<i>${d.timestamp.toDateString()} | Reflection state point ${d.point}</i><br> ${d.text}`), exit => exit.remove());
    }
    handleSort(data) {
        const _this = this;
        let sortedData = groupBy(data, "pseudonym");
        d3.select("#sort-users .btn-group-toggle").on("click", function (e) {
            var selectedOption = e.target.control.value;
            const parentEl = d3.select(`#sort-users input[value="${selectedOption}"]`).node().parentElement;
            d3.selectAll("#sort-users .btn-group-toggle i")
                .classed("d-none", true);
            d3.select(parentEl).select("i")
                .classed("d-none", false);
            sortedData = sortedData.sort(function (a, b) {
                if (selectedOption == "name") {
                    d3.select(parentEl).select("i").classed(_this.sorted == "name" ? "fa-chevron-up" : "fa-chevron-down", true);
                    return _this.sort.sortData(a.key, b.key, _this.sorted == "name" ? true : false);
                }
                else if (selectedOption == "point") {
                    d3.select(parentEl).select("i").classed(_this.sorted == "point" ? "fa-chevron-up" : "fa-chevron-down", true);
                    return _this.sort.sortData(calculateMean(a.value.map(d => d.point)), calculateMean(b.value.map(d => d.point)), _this.sorted == "point" ? true : false);
                }
            });
            _this.sorted = _this.sort.setSorted(_this.sorted, selectedOption);
            _this.renderTabContent(data, sortedData);
        });
    }
    ;
    getUserStatisticBinName(data, thresholds) {
        let distressed = thresholds[0];
        let soaring = thresholds[1];
        if (data.point <= distressed) {
            return "Distressed";
        }
        else if (data.point >= soaring) {
            return "Soaring";
        }
        else {
            return "GoingOK";
        }
    }
}
