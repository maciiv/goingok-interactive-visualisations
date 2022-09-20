import { ClickAdmin, Click } from "../interactions/click.js";
import { Sort } from "../interactions/sort.js";
import { Tooltip } from "../interactions/tooltip.js";
import { AdminControlTransitions, Transitions } from "../interactions/transitions.js";
import { Zoom } from "../interactions/zoom.js";
export class AdminControlInteractions extends AdminControlTransitions {
    constructor() {
        super(...arguments);
        this.tooltip = new Tooltip();
        this.zoom = new Zoom();
    }
}
export class AdminExperimentalInteractions extends AdminControlInteractions {
    constructor() {
        super(...arguments);
        this.click = new ClickAdmin();
        this.sort = new Sort();
    }
}
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
