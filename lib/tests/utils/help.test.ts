import {Help} from "../../src/utils/help"
import {test, expect, describe} from "@jest/globals"

describe("Testing help class", () => {
    document.body.innerHTML = ` <div id="test">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            <button>
                                                <i class="fas fa-question-circle"></i>
                                            </button>
                                        </h5>
                                    </div>
                                </div>
                            </div>`
    const button = document.querySelector("button")
    const help = new Help()

    test("Testing createPopover", () => {
        const actualPopover = help.createPopover("test-help", button)
        expect(actualPopover.id).toBe("test-help")
        expect(actualPopover.className).toBe("popover fade bs-popover-left show")
    })
})