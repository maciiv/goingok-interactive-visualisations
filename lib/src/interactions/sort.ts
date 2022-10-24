export class Sort<T> {
    protected id: string
    protected asc = false
    private _sortBy: string
    get sortBy() {
        return this._sortBy
    }
    set sortBy(sortBy: string) {
        this.setAsc(sortBy)
        this._sortBy = sortBy
        this.setChevronVisibility()
        this.handleChevronChange()
    }
    constructor(id: string, sortBy: string) {
        this.id = id
        this.sortBy = sortBy
    }
    sortData(data: Array<T>): Array<T> {
        return data.sort((a: any, b: any) => {
            return this.sortFunction(a[this.sortBy], b[this.sortBy])
        })
    };
    private sortFunction(a: any, b:any): number {
        if (a < b) {
            if (this.asc) {
                return 1
            } else {
                return -1
            }
        } if (a > b) {
            if (this.asc) {
                return -1
            } else {
                return 1
            }
        }
        return 0
    }
    private setAsc(sortBy: string): void {
        this.asc = this.sortBy === sortBy ? !this.asc : false
    }
    protected setChevronVisibility(): void {
        const parentEl = this.getParentEl()
        if (parentEl === undefined) {
            return
        }
        document.querySelectorAll(`#${this.id} .sort-by i`).forEach(c => c.classList.add("d-none"))
        document.querySelectorAll(`#${this.id} .sort-by label`).forEach(c => c.classList.remove("active"))
        parentEl.querySelector("i").classList.remove("d-none")
        parentEl.classList.add("active")
    }
    protected handleChevronChange(): void {
        const parentEl = this.getParentEl()
        if (parentEl === undefined) {
            return
        }
        parentEl.querySelector("i").classList.remove("fa-chevron-down", "fa-chevron-up")
        parentEl.querySelector("i").classList.add(this.asc ? "fa-chevron-up" : "fa-chevron-down")
    }
    private getParentEl(): HTMLElement {
        return document.querySelector(`#${this.id} .sort-by input[value="${this.sortBy}"]`)?.parentElement
    }
}