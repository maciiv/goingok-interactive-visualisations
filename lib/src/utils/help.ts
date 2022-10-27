import { IChart } from "../charts/chartBase.js";

export interface IHelp {
    helpPopover(id: string, content: string): void;
    removeHelp(chart: IChart): void;
}

export class Help implements IHelp {
    helpPopover(id: string, content: string): void {
        const helpId = `${id}-help`
        const button = document.querySelector<HTMLElement>(`#${id} .card-title button`);
        button.addEventListener("click", () => {    
            if (document.querySelector(`#${helpId}`) === null) {
                let popover = document.createElement("div")
                popover.setAttribute("id", helpId)
                popover.setAttribute("class", "popover fade bs-popover-left show")
                popover.style.top = `${window.pageYOffset + button.getBoundingClientRect().top}px`

                document.querySelector("body").appendChild(popover)
                
                let arrow = document.createElement("div")
                arrow.setAttribute("class", "arrow")
                arrow.style.top = "6px"
                popover.appendChild(arrow);

                let popoverBody = document.createElement("div")
                popoverBody.setAttribute("class", "popover-body")
                popoverBody.innerHTML = content
                popover.appendChild(popoverBody)

                if (button.getBoundingClientRect().left - popover.getBoundingClientRect().width > 0) {
                    popover.style.left = `${button.getBoundingClientRect().left - popover.getBoundingClientRect().width}px`;
                } else {
                    popover.style.left = `${button.getBoundingClientRect().right}px`;
                    popover.setAttribute("class", "popover fade bs-popover-right show")
                }
                
                button.querySelector("i").setAttribute("class", "fas fa-window-close")
            } else {
                document.querySelector(`#${helpId}`).remove()
                button.querySelector("i").setAttribute("class", "fas fa-question-circle")
            }
        })
    }
    removeHelp(chart: IChart): void {
        document.querySelector(`#${chart.id}-help`)?.remove();
        document.querySelector(`#${chart.id}-help-button`)?.remove();
        document.querySelector(`#${chart.id}-help-data`)?.remove();
        document.querySelector(`#${chart.id}-help-drag`)?.remove();
        document.querySelector(`#${chart.id}-help-zoom`)?.remove();
        let icon = document.querySelector(`#${chart.id} .card-title i`)
        icon.setAttribute("class", "fas fa-question-circle");
    }
}