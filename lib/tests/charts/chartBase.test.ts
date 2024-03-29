import { ChartBasic, ChartHelp, ChartPadding, ChartSeries } from "../../src/charts/chartBase"
import { test, expect, describe } from "@jest/globals"

window.document.body.innerHTML += ` <div id="test">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            <button>
                                                <i class="fas fa-question-circle"></i>
                                            </button>
                                        </h5>
                                        <h6 class="card-subtitle mb-2"></h6>
                                        <div class="chart-container"></div>
                                    </div>
                                </div>
                            </div>`

describe("Testing ChartHelp class", () => {
    const id = "test"
    const help = new ChartHelp(id)
    const content = "Content test"
    help.helpPopover(content)

    test("Testing createPopover", () => {      
        const popover = help.createPopover(content)
        expect(popover.id).toBe("test-help")
        expect(popover.className).toBe("popover fade bs-popover-left show")
    })
    test("Testing createArrow", () => {
        const arrow = help.createArrow()
        expect(arrow.className).toBe("arrow")
        expect(arrow.style.top).toBe("6px")
    })
    test("Testing createPopoverBody", () => {
        const popoverBody = help.createPopoverBody(content)
        expect(popoverBody.className).toBe("popover-body")
        expect(popoverBody.innerHTML).toBe(content)
    })
    test("Testing toogleIcon closed", () => {
        help.isOpen = false
        help.toogleIcon()
        expect(help.icon.className).toBe("fas fa-question-circle")
    })
    test("Testing toogleIcon open", () => {
        help.isOpen = true
        help.toogleIcon()
        expect(help.icon.className).toBe("fas fa-window-close")
    })
    test("Testing click to open", () => {
        help.isOpen = false
        help.button.click()
        const htmlPopover = document.querySelector(`#${help.id}`)
        expect(help.isOpen).toBe(true) 
        expect(help.icon.className).toBe("fas fa-window-close")
        expect(help.popover).toBeDefined() 
        expect(htmlPopover).toBeDefined()
    })
    test("Testing click to close", () => {
        help.isOpen = true
        help.button.click()
        expect(help.isOpen).toBe(false) 
        expect(help.icon.className).toBe("fas fa-question-circle")
        expect(help.popover).toBeUndefined()
    })
})

describe("Testing ChartBasic class", () => {
    const id = "test"
    const chart = new ChartBasic(id)
    test("Testing id", () => {
        expect(chart.id).toBe(id)
    })
    test("Testing width", () => {
        expect(chart.width).toBe(0)
    })
    test("Testing height", () => {
        expect(chart.height).toBe(0)
    })
    test("Testing padding", () => {
        expect(chart.padding).toEqual(new ChartPadding())
    })
})