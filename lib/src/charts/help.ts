import { IChart } from "./charts.js";

export interface IHelp {
    helpPopover(button: any, id: string, content: string): boolean;
    removeHelp(chart: IChart): void;
}

export class Help implements IHelp {
    helpPopover(button: any, id: string, content: string): boolean {
        if (document.querySelector(`#${id}`) === null) {
            let popover = document.createElement("div")
            popover.setAttribute("id", id)
            popover.setAttribute("class", "popover fade bs-popover-left show")
            popover.style.top = `${window.pageYOffset + button.node().getBoundingClientRect().top}px`

            document.querySelector("body").appendChild(popover)
            
            let arrow = document.createElement("div")
            arrow.setAttribute("class", "arrow")
            arrow.style.top = "6px"
            popover.appendChild(arrow);

            let popoverBody = document.createElement("div")
            popoverBody.setAttribute("class", "popover-body")
            popoverBody.innerHTML = content
            popover.appendChild(popoverBody)

            if (button.node().getBoundingClientRect().left - popover.getBoundingClientRect().width > 0) {
                popover.style.left = "left", `${button.node().getBoundingClientRect().left - popover.getBoundingClientRect().width}px`;
            } else {
                popover.style.left = "left", `${button.node().getBoundingClientRect().right}px`;
                popover.setAttribute("class", "popover fade bs-popover-right show")
            }
            
            button.select("i")
                .attr("class", "fas fa-window-close")
            return true;
        } else {
            document.querySelector(`#${id}`).remove();
            button.select("i")
                .attr("class", "fas fa-question-circle")
            return false;
        }
    };
    removeHelp(chart: IChart): void {
        document.querySelector(`#${chart.id}-help`)?.remove();
        document.querySelector(`#${chart.id}-help-button`)?.remove();
        document.querySelector(`#${chart.id}-help-data`)?.remove();
        document.querySelector(`#${chart.id}-help-drag`)?.remove();
        document.querySelector(`#${chart.id}-help-zoom`)?.remove();
        let icon = document.querySelector(`#${chart.id} .card-title i`)
        icon.setAttribute("class", "fas fa-question-circle");
    };
}