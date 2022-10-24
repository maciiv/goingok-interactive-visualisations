;
import { Sort } from "../../interactions/sort.js";
export class Reflections {
    constructor(data) {
        this.id = "reflections";
        this.sort = new Sort("sort", "timestamp");
        this.data = data;
    }
    get data() {
        return this._data;
    }
    set data(entries) {
        this._data = entries;
        this.render();
        this.extend !== undefined ? this.extend() : null;
    }
    render() {
        const _this = this;
        d3.select("#reflections .card-subtitle")
            .html(_this.data.length == 1 ? `Filtering by <span class="badge badge-pill badge-info">${_this.data[0].timestamp.toDateString()} <i class="fas fa-window-close"></i></span>` :
            "");
        d3.select("#reflections .reflections-tab")
            .selectAll(".reflection")
            .data(_this.data)
            .join(enter => enter.append("div")
            .attr("id", d => `ref-${d.refId}`)
            .attr("class", "reflection")
            .call(div => div.append("p")
            .attr("class", "reflection-text")
            .html(d => _this.text(d))), update => update.attr("id", d => `ref-${d.refId}`)
            .select("p")
            .html(d => _this.text(d)), exit => exit.remove());
        _this.handleSort();
    }
    text(data) {
        let html = `<i>${data.timestamp.toDateString()} | Point: ${data.point}</i><br>`;
        for (var i = 0; i < data.text.length; i++) {
            const isOpenTag = data.nodes.find(c => c.startIdx === i);
            const isCloseTag = data.nodes.find(c => c.endIdx === i);
            if (isOpenTag !== undefined) {
                html += `<span id="node-${isOpenTag.idx}" class="badge badge-pill" style="border: 2px solid ${isOpenTag.properties["color"]}">${data.text[i]}`;
            }
            else if (isCloseTag !== undefined) {
                html += `${data.text[i]}</span>`;
            }
            else {
                html += data.text[i];
            }
        }
        return html;
    }
    handleSort() {
        const _this = this;
        const id = "sort";
        d3.selectAll(`#${id} .btn-group-toggle label`).on("click", function () {
            const selectedOption = this.control.value;
            _this.sort.sortBy = selectedOption;
            _this._data = _this.sort.sortData(_this.data);
            _this.render();
        });
    }
    ;
}
