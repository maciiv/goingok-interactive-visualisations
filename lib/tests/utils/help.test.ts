import {Help} from "../../src/utils/help"
import {test, expect} from "../../node_modules/@jest/globals"

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
const help = new Help()

test("Testing help class", () => {

})