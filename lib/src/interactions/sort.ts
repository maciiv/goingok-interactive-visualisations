export interface ISort {
    sortData(a: number, b: number, sorted: boolean): number
    setSorted(sorted: string, option: string): string
    setChevronVisibility(id: string, option: string): void
    handleChevronChange(id: string, option: string, chevron: string): void
}

export class Sort implements ISort {
    sortData(a: number | Date | string, b: number | Date | string, sorted: boolean): number {
        if (a < b) {
            if (sorted) {
                return -1;
            } else {
                return 1;
            }
        } if (a > b) {
            if (sorted) {
                return 1;
            } else {
                return -1;
            }
        }
        return 0;
    };
    setSorted(sorted: string, option: string): string {
        return sorted == option ? "" : option;
    }
    setChevronVisibility(id: string, option: string): void {
        const parentEl = this.getParentEl(id, option)
        document.querySelectorAll(`#${id} .btn-group-toggle i`).forEach(c => c.classList.add("d-none"))
        document.querySelectorAll(`#${id} .btn-group-toggle label`).forEach(c => c.classList.remove("active"))
        parentEl.querySelector("i").classList.remove("d-none")
        parentEl.classList.add("active")
    }
    handleChevronChange(id: string, option: string, chevron: string): void {
        const parentEl = this.getParentEl(id, option)
        parentEl.querySelector("i").classList.remove("fa-chevron-down", "fa-chevron-up")
        parentEl.querySelector("i").classList.add(chevron)
    }
    private getParentEl(id: string, option: string): HTMLElement {
        return document.querySelector(`#${id} input[value="${option}"]`).parentElement
    }
}