/**
 * This file was generated from InteractiveSVG.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, WebImage } from "mendix";

export type PropertyidentifierEnum = "id__" | "class__";

export type PropertytypeEnum = "click" | "dblclick" | "mouseenter" | "mouseleave" | "mouseup";

export interface ActionsType {
    propertyidentifier: PropertyidentifierEnum;
    propertyname: string;
    propertytype: PropertytypeEnum;
    arialabeltext?: DynamicValue<string>;
    propertyvalue?: ActionValue;
}

export interface ActionsPreviewType {
    propertyidentifier: PropertyidentifierEnum;
    propertyname: string;
    propertytype: PropertytypeEnum;
    arialabeltext: string;
    propertyvalue: {} | null;
}

export interface InteractiveSVGContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
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
    actions: ActionsPreviewType[];
}
