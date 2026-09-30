import { DynamicValue, WebImage } from "mendix";
import { CSSProperties, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { ActionsType } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface InteractiveSVGComponentProps {
    className?: string;
    style?: CSSProperties;
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
}

// Tolerates a leading "#" or "." and escapes the name, so IDs like "1" or "a:b" from design tools stay valid selectors.
function toSelector(action: ActionsType): string | undefined {
    const name = action.propertyname.trim();
    if (action.propertyidentifier === "class__") {
        const classes = name
            .split(/\s+/)
            .map(c => c.replace(/^\./, ""))
            .filter(Boolean);
        return classes.length > 0 ? classes.map(c => `.${CSS.escape(c)}`).join("") : undefined;
    }
    const id = name.replace(/^#/, "");
    return id ? `#${CSS.escape(id)}` : undefined;
}

function findTargets(svgElement: SVGSVGElement, action: ActionsType): SVGElement[] {
    const selector = toSelector(action);
    return selector ? Array.from(svgElement.querySelectorAll<SVGElement>(selector)) : [];
}

export function InteractiveSVGComponent({
    className,
    style,
    svg,
    actions
}: InteractiveSVGComponentProps): ReactElement {
    const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
    const actionsRef = useRef(actions);

    // Update ref to latest actions on every render to ensure listeners use current data
    actionsRef.current = actions;

    // A loading value keeps its previous image, so only a real URI change re-injects the SVG
    const uri = svg?.value?.uri;

    // Callbacks must keep their identity: ReactSVG re-injects the SVG whenever one of its props changes
    const onAfterInjection = useCallback((element: SVGSVGElement) => setSvgElement(element), []);

    const onError = useCallback((error: unknown) => {
        console.error("SVG injection error:", error);
    }, []);

    // Selectors and event types are static settings, so listeners are only rebound when a new SVG is injected
    const bindingKey = actions.map(a => `${a.propertyidentifier}:${a.propertyname}:${a.propertytype}`).join("|");

    useEffect(() => {
        if (!svgElement) {
            return;
        }
        const cleanups: Array<() => void> = [];
        actionsRef.current.forEach((action, index) => {
            const targets = findTargets(svgElement, action);
            if (targets.length === 0) {
                console.warn(`InteractiveSVG: no SVG element matches "${action.propertyname}".`);
            }
            // Resolve by index at event time, so each action fires with its latest canExecute/isExecuting state
            const listener = (): void => {
                const actionValue = actionsRef.current[index]?.propertyvalue;
                if (actionValue?.canExecute && !actionValue.isExecuting) {
                    actionValue.execute();
                }
            };
            targets.forEach(target => {
                target.addEventListener(action.propertytype, listener);
                cleanups.push(() => target.removeEventListener(action.propertytype, listener));
            });
        });
        return () => cleanups.forEach(cleanup => cleanup());
    }, [svgElement, bindingKey]);

    // Runs on every update, so the cursor follows canExecute and aria-labels appear once their text has loaded
    useEffect(() => {
        if (!svgElement) {
            return;
        }
        const targetStates = new Map<SVGElement, { executable: boolean; label?: string }>();
        actions.forEach(action => {
            findTargets(svgElement, action).forEach(target => {
                const state = targetStates.get(target) ?? { executable: false };
                state.executable = state.executable || !!action.propertyvalue?.canExecute;
                state.label = state.label || action.arialabeltext?.value;
                targetStates.set(target, state);
            });
        });
        targetStates.forEach(({ executable, label }, target) => {
            target.style.cursor = executable ? "pointer" : "";
            if (label) {
                target.setAttribute("aria-label", label);
            }
        });
    }, [svgElement, actions]);

    return (
        <div className={classNames("widget-interactive-svg", className)} style={style}>
            {uri && (
                <ReactSVG
                    src={uri}
                    // Renumbering renames the IDs of <path>, gradient, clipPath... elements (e.g. "shape" -> "shape-1"),
                    // which would stop ID-based actions from finding them
                    renumerateIRIElements={false}
                    afterInjection={onAfterInjection}
                    onError={onError}
                />
            )}
        </div>
    );
}
