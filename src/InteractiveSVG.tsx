import { ReactElement, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";

import { InteractiveSVGContainerProps } from "../typings/InteractiveSVGProps";

import "./ui/InteractiveSVG.css";

export function InteractiveSVG({ svg, actions, prefix }: InteractiveSVGContainerProps): ReactElement {
    return <HelloWorldSample svg={svg} actions={actions} prefix={prefix} />;
}
