import { ReactElement } from "react";
import { InteractiveSVGComponent } from "./components/InteractiveSVGComponent";

import { InteractiveSVGContainerProps } from "../typings/InteractiveSVGProps";

import "./ui/InteractiveSVG.css";

export function InteractiveSVG({
    class: className,
    style,
    tabIndex,
    svg,
    actions
}: InteractiveSVGContainerProps): ReactElement {
    return (
        <InteractiveSVGComponent className={className} style={style} tabIndex={tabIndex} svg={svg} actions={actions} />
    );
}
