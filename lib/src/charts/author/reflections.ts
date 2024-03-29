import { select, selectAll } from "d3"
import { INodes, IReflection, IReflectionAnalytics } from "../../data/data"
import { Sort } from "../../interactions/sort"
import { ChartHelp, IChartHelp, Logger } from "../chartBase"

export class Reflections {
    id: string
    sort: Sort<IReflectionAnalytics>
    help: IChartHelp
    extend?: Function
    logger = new Logger()
    private _nodes: INodes[]
    get nodes() {
        return this._nodes
    }
    set nodes(nodes: INodes[]) {
        this._nodes = nodes
        this.nodes !== undefined ? this.fillNodesText() : null
    }
    private _data: IReflectionAnalytics[]
    get data() {
        return this._data
    }
    set data(entries: IReflectionAnalytics[]) {
        
        this._data = entries.map(c => {
            c.nodes = c.nodes.filter(d => d.selected)
            return c
        })
        this.render()
        this.extend !== undefined ? this.extend() : null
    }
    constructor(data: IReflectionAnalytics[]) {
        this.id = "reflections"
        this.sort = new Sort("sort-reflections", "timestamp")
        this.help = new ChartHelp(this.id)
        this.data = data
    }
    render() {
        const _this = this

        select<HTMLDivElement, IReflection>(`#${_this.id} .reflections-tab`)
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
                html += `<span id="node-${isOpenTag.idx}" class="badge rounded-pill" style="border: 2px solid ${isOpenTag.properties["color"]}">${data.text[i]}`
            } else if (isCloseTag !== undefined) {
                html += `${data.text[i]}</span>`
            } else {
                html += data.text[i]
            }
        }     
        return html;
    }
    private fillNodesText() {
        selectAll<HTMLDivElement, IReflection>(`#${this.id} .reflections-tab div`)
        .filter(c => this.nodes.map(d => d.refId).includes(c.refId))
        .selectAll("span")
            .each((c, i, g) => {
                let node = this.nodes.find(r => r.idx === parseInt(select(g[i]).attr("id").replace("node-", "")))
                if (node !== undefined) {
                    select(g[i]).style("background-color", node.properties["color"])
                }
            })
    }
    private handleSort() {
        const _this = this
        const id = "sort-reflections"
        selectAll(`#${id} .sort-by label`).on("click", function (this: HTMLLabelElement) {
            const selectedOption = (this.control as HTMLInputElement).value
            _this.sort.sortBy = selectedOption
            _this._data = _this.sort.sortData(_this.data)
            _this.render()
            if(_this.nodes !== undefined) _this.fillNodesText()

            _this.logger.logUIEvent(`sort-reflections ${selectedOption} click`)
        });
    };
}