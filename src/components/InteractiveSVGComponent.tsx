import { DynamicValue, WebImage } from "mendix";
import { ReactElement, createElement, useEffect, useState } from "react";
import { ActionsType } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface InteractiveSVGComponentProps {
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
    prefix: string;
}

export function InteractiveSVGComponent({ svg, actions, prefix }: InteractiveSVGComponentProps): ReactElement {
    const [svgState, setSvgState] = useState<DynamicValue<WebImage> | null>(null);

    useEffect(() => {
        if (svg) {
            setSvgState(svg);
        } else {
            setSvgState(null);
        }
    }, [svg]);

    const actionCallbacks = actions.reduce<Record<string, () => void>>((acc, { propertyname, propertyvalue }) => {
        if (propertyvalue?.canExecute) {
            acc[propertyname] = () => propertyvalue.execute();
        }
        return acc;
    }, {});

    if (!svgState || svgState.status !== "available") {
        return <div>Loading...</div>;
    } else {
        return (
            <ReactSVG
                src={svgState.value.uri}
                afterInjection={(svgElement: SVGElement | null) => {
                    if (svgElement) {
                        const elements = svgElement.querySelectorAll(`[id^="${prefix}"]`);
                        elements.forEach(el => {
                            const callback = actionCallbacks[el.id];
                            if (callback) {
                                el.addEventListener("click", callback);
                                (el as HTMLElement).style.cursor = "pointer";
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
