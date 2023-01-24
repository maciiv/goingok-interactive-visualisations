import { IChart } from "../charts/chartBase";

export interface IHelp {
    helpPopover(id: string, content: string): void
    removeHelp(chart: IChart): void
}

export class Help implements IHelp {
    helpPopover(id: string, content: string): void {
        const _this = this
        const helpId = `${id}-help`
        const button = document.querySelector<HTMLButtonElement>(`#${id} .card-title button`)
        if (button === null) return;
        button.addEventListener("click", function() {    
            let icon = this.querySelector("i")
            if (document.querySelector(`#${helpId}`) === null) {
                const popover = _this.createPopover(helpId, this)
                document.querySelector("body").appendChild(popover)
                
                const arrow = _this.createArrow()
                popover.appendChild(arrow)

                const popoverBody = _this.createPopoverBody(content)
                popover.appendChild(popoverBody)

                if (this.getBoundingClientRect().left - popover.getBoundingClientRect().width > 0) {
                    popover.style.left = `${this.getBoundingClientRect().left - popover.getBoundingClientRect().width}px`;
                } else {
                    popover.style.left = `${this.getBoundingClientRect().right}px`;
                    popover.setAttribute("class", "popover fade bs-popover-right show")
                }
                
                icon?.setAttribute("class", "fas fa-window-close")
            } else {
                document.querySelector(`#${helpId}`).remove()
                icon?.setAttribute("class", "fas fa-question-circle")
            }
        })
    }
    removeHelp(chart: IChart): void {
        document.querySelector(`#${chart.id}-help`)?.remove()
        document.querySelector(`#${chart.id}-help-button`)?.remove()
        document.querySelector(`#${chart.id}-help-data`)?.remove()
        document.querySelector(`#${chart.id}-help-drag`)?.remove()
        document.querySelector(`#${chart.id}-help-zoom`)?.remove()
        let icon = document.querySelector(`#${chart.id} .card-title i`)
        icon?.setAttribute("class", "fas fa-question-circle")
    }
    createPopover(id: string, button: HTMLButtonElement | null): HTMLDivElement {
        const popover = document.createElement("div")
        popover.setAttribute("id", id)
        popover.setAttribute("class", "popover fade bs-popover-left show")
        const top = button === null ? window.pageYOffset : window.pageYOffset + button.getBoundingClientRect().top
        popover.style.top = `${top}px`
        return popover
    }
    createArrow(): HTMLDivElement {
        const arrow = document.createElement("div")
        arrow.setAttribute("class", "arrow")
        arrow.style.top = "6px"
        return arrow
    }
    createPopoverBody(content: string): HTMLDivElement {
        const popoverBody = document.createElement("div")
        popoverBody.setAttribute("class", "popover-body")
        popoverBody.innerHTML = content
        return popoverBody
    }
}