import { Click } from "../interactions/click.js";
import { Sort } from "../interactions/sort.js";
import { Tooltip } from "../interactions/tooltip.js";
import { Transitions } from "../interactions/transitions.js";
import { Zoom } from "../interactions/zoom.js";
export class AuthorControlTransitions extends Transitions {
}
export class AuthorControlInteractions extends AuthorControlTransitions {
    constructor() {
        super(...arguments);
        this.tooltip = new Tooltip();
        this.zoom = new Zoom();
    }
}
export class AuthorExperimentalInteractions extends AuthorControlInteractions {
    constructor() {
        super(...arguments);
        this.click = new Click();
        this.sort = new Sort();
    }
}
