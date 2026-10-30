import { ReactElement } from "react";
import { InteractiveSVGComponent } from "./components/InteractiveSVGComponent";

import { InteractiveSVGContainerProps } from "../typings/InteractiveSVGProps";

import "./ui/InteractiveSVG.css";

export function InteractiveSVG({
    class: className,
    style,
    tabIndex,
    svg,
    triggeredelement,
    actions,
    states,
    sanitizemode
}: InteractiveSVGContainerProps): ReactElement {
    return (
        <InteractiveSVGComponent
            className={className}
            style={style}
            tabIndex={tabIndex}
            svg={svg}
            triggeredElement={triggeredelement}
            actions={actions}
            states={states}
            sanitizeMode={sanitizemode}
        />
    );
}
