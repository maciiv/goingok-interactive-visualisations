import { IClick, ClickAdmin, Click } from "../interactions/click.js";
import { ISort, Sort } from "../interactions/sort.js";
import { ITooltip, Tooltip } from "../interactions/tooltip.js";
import { IAdminControlTransitions, AdminControlTransitions, ITransitions, Transitions } from "../interactions/transitions.js";
import { IZoom, Zoom } from "../interactions/zoom.js";
export interface IAdminControlInteractions extends IAdminControlTransitions {
    tooltip: ITooltip;
    zoom: IZoom;
}
export declare class AdminControlInteractions extends AdminControlTransitions implements IAdminControlInteractions {
    tooltip: Tooltip;
    zoom: Zoom;
}
export interface IAdminExperimentalInteractions extends IAdminControlInteractions {
    click: IClick;
    sort: ISort;
}
export declare class AdminExperimentalInteractions extends AdminControlInteractions implements IAdminExperimentalInteractions {
    click: ClickAdmin;
    sort: Sort;
}
export interface IAuthorControlTransitions extends ITransitions {
}
export declare class AuthorControlTransitions extends Transitions implements IAuthorControlTransitions {
}
export interface IAuthorControlInteractions extends IAuthorControlTransitions {
    tooltip: ITooltip;
    zoom: IZoom;
}
export declare class AuthorControlInteractions extends AuthorControlTransitions implements IAuthorControlInteractions {
    tooltip: Tooltip;
    zoom: Zoom;
}
export interface IAuthorExperimentalInteractions extends IAuthorControlInteractions {
    click: IClick;
    sort: ISort;
}
export declare class AuthorExperimentalInteractions extends AuthorControlInteractions implements IAuthorExperimentalInteractions {
    click: Click;
    sort: Sort;
}
