import {test, expect, describe} from "@jest/globals"
import {ChartHelp} from "../../src/charts/chartBase"

// describe("Testing help class", () => {
//     document.body.innerHTML = ` <div id="test">
//                                 <div class="card">
//                                     <div class="card-body">
//                                         <h5 class="card-title">
//                                             <button>
//                                                 <i class="fas fa-question-circle"></i>
//                                             </button>
//                                         </h5>
//                                     </div>
//                                 </div>
//                             </div>`
//     const help = new ChartHelp()
//     const id = "test-help"
//     const button = document.querySelector("button")

//     test("Testing createPopover", () => {
//         const popover = help.createPopover(id, button)
//         expect(popover.id).toBe("test-help")
//         expect(popover.className).toBe("popover fade bs-popover-left show")
//     })

//     test("Testing createArrow", () => {
//         const arrow = help.createArrow()
//         expect(arrow.className).toBe("arrow")
//         expect(arrow.style.top).toBe("6px")
//     })

//     test("Testing createPopoverBody", () => {
//         const content = "Content test"
//         const popoverBody = help.createPopoverBody(content)
//         expect(popoverBody.className).toBe("popover-body")
//         expect(popoverBody.innerHTML).toBe(content)
//     })
// })