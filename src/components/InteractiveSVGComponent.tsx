import { DynamicValue, WebImage } from "mendix";
import { ReactElement, useEffect, useState } from "react";
import { ActionsType } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface InteractiveSVGComponentProps {
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
}

export function InteractiveSVGComponent({ svg, actions }: InteractiveSVGComponentProps): ReactElement {
    const [svgState, setSvgState] = useState<DynamicValue<WebImage> | null>(null);

    useEffect(() => {
        if (svg) {
            setSvgState(svg);
        } else {
            setSvgState(null);
        }
    }, [svg]);

    if (!svgState || svgState.status !== "available") {
        return <div>Loading...</div>;
    } else {
        return (
            <ReactSVG
                src={svgState.value.uri}
                beforeInjection={(svgElement: SVGElement | null) => {
                    if (svgElement) {
                        actions.forEach(action => {
                            if (action.propertyvalue?.canExecute) {
                                const selector =
                                    action.propertyidentifier === "class__"
                                        ? `.${action.propertyname}`
                                        : `#${action.propertyname}`;
                                const elements = svgElement.querySelectorAll(selector);
                                elements.forEach(el => {
                                    el.addEventListener(action.propertytype, () => {
                                        action.propertyvalue?.execute();
                                    });
                                    (el as HTMLElement).style.cursor = "pointer";
                                });
                            }
                        });
                    }
                }}
                onError={error => {
                    console.error("SVG injection error:", error);
                }}
            />
        );
    }
}
