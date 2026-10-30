/**
 * This file was generated from InteractiveSVG.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, EditableValue, WebImage } from "mendix";

export type PropertyidentifierEnum = "id__" | "class__";

export type PropertytypeEnum = "click" | "dblclick" | "mouseenter" | "mouseleave" | "mouseup" | "mousedown" | "contextmenu" | "longpress";

export interface ActionsType {
    propertyidentifier: PropertyidentifierEnum;
    propertyname: string;
    propertytype: PropertytypeEnum;
    arialabeltext?: DynamicValue<string>;
    propertyvalue?: ActionValue;
}

export type StateidentifierEnum = "id__" | "class__";

export interface StatesType {
    stateidentifier: StateidentifierEnum;
    statename: string;
    stateclass: string;
    statecondition: DynamicValue<boolean>;
}

export type SanitizemodeEnum = "standard" | "strict";

export interface ActionsPreviewType {
    propertyidentifier: PropertyidentifierEnum;
    propertyname: string;
    propertytype: PropertytypeEnum;
    arialabeltext: string;
    propertyvalue: {} | null;
}

export interface StatesPreviewType {
    stateidentifier: StateidentifierEnum;
    statename: string;
    stateclass: string;
    statecondition: string;
}

export interface InteractiveSVGContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    svg?: DynamicValue<WebImage>;
    triggeredelement?: EditableValue<string>;
    actions: ActionsType[];
    states: StatesType[];
    sanitizemode: SanitizemodeEnum;
}

export interface InteractiveSVGPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    svg: { type: "static"; imageUrl: string; } | { type: "dynamic"; entity: string; } | null;
    triggeredelement: string;
    actions: ActionsPreviewType[];
    states: StatesPreviewType[];
    sanitizemode: SanitizemodeEnum;
}
