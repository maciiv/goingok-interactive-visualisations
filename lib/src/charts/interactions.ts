import { IClick, Click } from "../interactions/click.js";
import { ISort, Sort } from "../interactions/sort.js";
import { ITooltip, Tooltip } from "../interactions/tooltip.js";
import { ITransitions, Transitions } from "../interactions/transitions.js";
import { IZoom, Zoom } from "../interactions/zoom.js";

export interface IAuthorControlTransitions extends ITransitions {
}

export class AuthorControlTransitions extends Transitions implements IAuthorControlTransitions {
}

export interface IAuthorControlInteractions extends IAuthorControlTransitions {
    tooltip: ITooltip;
    zoom: IZoom;
}

export class AuthorControlInteractions extends AuthorControlTransitions implements IAuthorControlInteractions {
    tooltip = new Tooltip();
    zoom = new Zoom();
}

export interface IAuthorExperimentalInteractions extends IAuthorControlInteractions {
    click: IClick;
    sort: ISort;
}

export class AuthorExperimentalInteractions extends AuthorControlInteractions implements IAuthorExperimentalInteractions {
    click = new Click();
    sort = new Sort();
}