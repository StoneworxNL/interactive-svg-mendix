import { ReactElement } from "react";
import { InteractiveSVGComponent } from "./components/InteractiveSVGComponent";

import { InteractiveSVGContainerProps } from "../typings/InteractiveSVGProps";

import "./ui/InteractiveSVG.css";

export function InteractiveSVG({ svg, actions }: InteractiveSVGContainerProps): ReactElement {
    return <InteractiveSVGComponent svg={svg} actions={actions} />;
}
