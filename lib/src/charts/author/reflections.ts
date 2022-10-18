import d3 from "d3"
import { IReflection, IReflectionAnalytics } from "../../data/data.js"
import { Sort } from "../../interactions/sort.js"
import { ExtendChart } from "../chartBase.js"

export class Reflections<T> {
    id: string
    sorted = ""
    sort = new Sort()
    dashboard?: T
    extend?: ExtendChart<T>
    private _data: IReflectionAnalytics[]
    get data() {
        return this._data
    }
    set data(entries: IReflectionAnalytics[]) {
        this._data = entries
        this.render()
        this.extend !== undefined && this.dashboard !== undefined ? this.extend(this.dashboard) : null
    }
    constructor(data: IReflectionAnalytics[]) {
        this.id = "reflections"
        this.data = data
    }
    render() {
        const _this = this

        d3.select("#reflections .card-subtitle")
        .html(_this.data.length == 1 ? `Filtering by <span class="badge badge-pill badge-info">${_this.data[0].timestamp.toDateString()} <i class="fas fa-window-close"></i></span>`:
            "");

        d3.select<HTMLDivElement, IReflection>("#reflections .reflections-tab")
            .selectAll(".reflection")
            .data(_this.data)
            .join(
                enter => enter.append("div")
                    .attr("id", d => `ref-${d.refId}`)
                    .attr("class", "reflection")
                    .call(div => div.append("p")
                        .attr("class", "reflection-text")
                        .html(d => _this.text(d))),
                update => update.attr("id", d => `ref-${d.refId}`)
                    .select<HTMLParagraphElement>("p")
                    .html(d => _this.text(d)),
                exit => exit.remove()
            )
        
        _this.handleSort()
    }
    private text(data: IReflectionAnalytics): string {
        let html = `<i>${data.timestamp.toDateString()} | Point: ${data.point}</i><br>`
        for (var i = 0; i < data.text.length; i++) {
            const isOpenTag = data.nodes.find(c => c.startIdx === i);
            const isCloseTag = data.nodes.find(c => c.endIdx === i);
            if (isOpenTag !== undefined) {
                html += `<span id="node-${isOpenTag.idx}" class="badge badge-pill" style="border: 2px solid ${isOpenTag.properties["color"]}">${data.text[i]}`
            } else if (isCloseTag !== undefined) {
                html += `${data.text[i]}</span>`
            } else {
                html += data.text[i]
            }
        }     
        return html;
    }
    private handleSort() {
        const _this = this
        const id = "sort"
        d3.select(`#${id} .btn-group-toggle`).on("click", function(e: any) {
            const selectedOption = e.target.control.value;
            const chevron = _this.sorted === selectedOption ? "fa-chevron-down" : "fa-chevron-up"
            _this.sort.setChevronVisibility(id, selectedOption)
            _this._data = _this.data.sort(function (a, b) {
                if (selectedOption == "date") {
                    _this.sort.handleChevronChange(id, selectedOption, chevron)
                    return _this.sort.sortData(a.timestamp, b.timestamp, _this.sorted == "date" ? true : false);
                } else if (selectedOption == "point") {
                    _this.sort.handleChevronChange(id, selectedOption, chevron)
                    return _this.sort.sortData(a.point, b.point, _this.sorted == "point" ? true : false);
                }
            });
            _this.sorted = _this.sort.setSorted(_this.sorted, selectedOption);
            _this.render()
        });
    };
}