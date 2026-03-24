import { DynamicValue, WebImage } from "mendix";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ActionsType } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface InteractiveSVGComponentProps {
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
}

export function InteractiveSVGComponent({ svg, actions }: InteractiveSVGComponentProps): ReactElement {
    const [svgState, setSvgState] = useState<DynamicValue<WebImage> | null>(null);
    const actionsRef = useRef(actions);

    // Update ref to latest actions on every render to ensure callbacks use current data
    actionsRef.current = actions;

    useEffect(() => {
        if (svg?.status === "available" && svgState === null) {
            setSvgState(svg);
        }
    }, [svg, svgState]);

    const onBeforeInjection = useCallback((svgElement: SVGElement | null) => {
        if (svgElement) {
            // Use the ref here so the callback function identity remains stable
            actionsRef.current.forEach(action => {
                if (action.propertyvalue?.canExecute) {
                    const selector =
                        action.propertyidentifier === "class__" ? `.${action.propertyname}` : `#${action.propertyname}`;
                    const elements = svgElement.querySelectorAll(selector);
                    elements.forEach(el => {
                        el.addEventListener(action.propertytype, () => {
                            const currentAction = actionsRef.current.find(
                                a =>
                                    a.propertyname === action.propertyname &&
                                    a.propertyidentifier === action.propertyidentifier &&
                                    a.propertytype === action.propertytype
                            );
                            currentAction?.propertyvalue?.execute();
                        });
                        (el as HTMLElement).style.cursor = "pointer";
                    });
                }
            });
        }
    }, []);

    const onError = useCallback((error: any) => {
        console.error("SVG injection error:", error);
    }, []);

    if (!svgState || svgState.status !== "available") {
        return <div>Loading...</div>;
    } else {
        return <ReactSVG src={svgState.value.uri} beforeInjection={onBeforeInjection} onError={onError} />;
    }
}
