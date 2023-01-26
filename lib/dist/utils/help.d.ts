import { IChart } from "../charts/chartBase";
export interface IHelp {
    helpPopover(id: string, content: string): void;
    removeHelp(chart: IChart): void;
}
export declare class Help implements IHelp {
    helpPopover(id: string, content: string): void;
    removeHelp(chart: IChart): void;
    createPopover(id: string, button: HTMLButtonElement | null): HTMLDivElement;
    createArrow(): HTMLDivElement;
    createPopoverBody(content: string): HTMLDivElement;
}
