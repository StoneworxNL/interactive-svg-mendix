/**
 * This file was generated from InteractiveSVG.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, WebImage } from "mendix";

export interface ActionsType {
    propertyname: string;
    propertyvalue?: ActionValue;
}

export interface ActionsPreviewType {
    propertyname: string;
    propertyvalue: {} | null;
}

export interface InteractiveSVGContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    svg?: DynamicValue<WebImage>;
    prefix: string;
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
    prefix: string;
    actions: ActionsPreviewType[];
}
