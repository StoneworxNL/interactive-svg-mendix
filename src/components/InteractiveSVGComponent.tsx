import { DynamicValue, WebImage } from "mendix";
import { CSSProperties, ReactElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import classNames from "classnames";
import DOMPurify from "dompurify";
import { ActionsType, PropertytypeEnum } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface InteractiveSVGComponentProps {
    className?: string;
    style?: CSSProperties;
    tabIndex?: number;
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
}

// Pointer interactions that keyboard users trigger with Enter or Space, in order of preference
const ACTIVATION_EVENTS: PropertytypeEnum[] = ["click", "dblclick", "mouseup"];

// Lists the attributes the widget added to an element, so they can be removed again without touching the SVG's own
const OWNED_ATTRIBUTES = "data-interactive-svg";

function quote(value: string): string {
    return `"${value.replace(/["\\]/g, "\\$&")}"`;
}

// Attribute selectors keep any name valid (IDs like "1st" or "a:b" from design tools); a leading "#" or "." is tolerated
function toSelector(action: ActionsType): string | undefined {
    const name = action.propertyname.trim();
    if (action.propertyidentifier === "class__") {
        const classes = name
            .split(/\s+/)
            .map(c => c.replace(/^\./, ""))
            .filter(Boolean);
        return classes.length > 0 ? classes.map(c => `[class~=${quote(c)}]`).join("") : undefined;
    }
    const id = name.replace(/^#/, "");
    return id ? `[id=${quote(id)}]` : undefined;
}

function findTargets(svgElement: SVGSVGElement, action: ActionsType): SVGElement[] {
    const selector = toSelector(action);
    return selector ? Array.from(svgElement.querySelectorAll<SVGElement>(selector)) : [];
}

// The SVG is inlined into the page, so strip scripts, event-handler attributes, javascript: links and foreignObject
// content before it is inserted. IDs are kept even when they match DOM property names, as actions rely on them, and
// so is "role", which the SVG profile would otherwise drop.
function sanitize(svg: SVGElement): void {
    DOMPurify.sanitize(svg, {
        IN_PLACE: true,
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_ATTR: ["role"],
        SANITIZE_DOM: false
    });
}

// Sets (or, with no value, removes) an attribute the widget manages, leaving values the SVG itself defines alone
function setOwnedAttribute(target: Element, name: string, value: string | undefined): void {
    const owned = new Set(target.getAttribute(OWNED_ATTRIBUTES)?.split(" ").filter(Boolean));
    if (value !== undefined && (owned.has(name) || !target.hasAttribute(name))) {
        target.setAttribute(name, value);
        owned.add(name);
    } else if (value === undefined && owned.has(name)) {
        target.removeAttribute(name);
        owned.delete(name);
    }
    if (owned.size > 0) {
        target.setAttribute(OWNED_ATTRIBUTES, [...owned].join(" "));
    } else {
        target.removeAttribute(OWNED_ATTRIBUTES);
    }
}

export function InteractiveSVGComponent({
    className,
    style,
    tabIndex,
    svg,
    actions
}: InteractiveSVGComponentProps): ReactElement {
    const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
    const actionsRef = useRef(actions);

    // Keep the ref on the latest actions after every render, before any listener can read it
    useLayoutEffect(() => {
        actionsRef.current = actions;
    });

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
        const listen = (target: SVGElement, type: string, listener: (event: Event) => void): void => {
            target.addEventListener(type, listener);
            cleanups.push(() => target.removeEventListener(type, listener));
        };
        // Resolve by index at event time, so each action runs with its latest canExecute/isExecuting state
        const run = (index: number): void => {
            const actionValue = actionsRef.current[index]?.propertyvalue;
            if (actionValue?.canExecute && !actionValue.isExecuting) {
                actionValue.execute();
            }
        };

        const actionsByTarget = new Map<SVGElement, number[]>();
        actionsRef.current.forEach((action, index) => {
            const targets = findTargets(svgElement, action);
            if (targets.length === 0) {
                console.warn(`InteractiveSVG: no SVG element matches "${action.propertyname}".`);
            }
            targets.forEach(target => {
                listen(target, action.propertytype, () => run(index));
                actionsByTarget.set(target, [...(actionsByTarget.get(target) ?? []), index]);
            });
        });

        // Keyboard equivalents: Enter/Space run the element's first kind of click action; keyboard focus and blur
        // stand in for hover and mouse leave
        actionsByTarget.forEach((indexes, target) => {
            const ofType = (type: PropertytypeEnum): number[] =>
                indexes.filter(i => actionsRef.current[i].propertytype === type);
            const activation = ACTIVATION_EVENTS.map(ofType).find(list => list.length > 0);
            if (activation) {
                listen(target, "keydown", event => {
                    const { key } = event as KeyboardEvent;
                    if (key === "Enter" || key === " ") {
                        event.preventDefault();
                        activation.forEach(run);
                    }
                });
            }
            const onEnter = ofType("mouseenter");
            const onLeave = ofType("mouseleave");
            if (onEnter.length > 0 || onLeave.length > 0) {
                // A mouse click also focuses the element, but its hover already ran; only keyboard focus counts
                let keyboardFocus = false;
                listen(target, "focus", () => {
                    keyboardFocus = target.matches(":focus-visible");
                    if (keyboardFocus) {
                        onEnter.forEach(run);
                    }
                });
                listen(target, "blur", () => {
                    if (keyboardFocus) {
                        onLeave.forEach(run);
                    }
                    keyboardFocus = false;
                });
            }
        });
        return () => cleanups.forEach(cleanup => cleanup());
    }, [svgElement, bindingKey]);

    // Runs on every update, so focusability, role, cursor and aria-labels follow canExecute and late-loading text
    useEffect(() => {
        if (!svgElement) {
            return;
        }
        const targetStates = new Map<SVGElement, { executable: boolean; activatable: boolean; label?: string }>();
        actions.forEach(action => {
            const executable = !!action.propertyvalue?.canExecute;
            findTargets(svgElement, action).forEach(target => {
                const state = targetStates.get(target) ?? { executable: false, activatable: false };
                state.executable = state.executable || executable;
                state.activatable =
                    state.activatable || (executable && ACTIVATION_EVENTS.includes(action.propertytype));
                state.label = state.label || action.arialabeltext?.value;
                targetStates.set(target, state);
            });
        });
        targetStates.forEach(({ executable, activatable, label }, target) => {
            target.style.cursor = executable ? "pointer" : "";
            setOwnedAttribute(target, "tabindex", executable ? String(tabIndex ?? 0) : undefined);
            setOwnedAttribute(target, "role", activatable ? "button" : undefined);
            if (label) {
                target.setAttribute("aria-label", label);
            }
        });
    }, [svgElement, actions, tabIndex]);

    return (
        <div className={classNames("widget-interactive-svg", className)} style={style}>
            {uri && (
                <ReactSVG
                    src={uri}
                    // Renumbering renames the IDs of <path>, gradient, clipPath... elements (e.g. "shape" -> "shape-1"),
                    // which would stop ID-based actions from finding them
                    renumerateIRIElements={false}
                    beforeInjection={sanitize}
                    afterInjection={onAfterInjection}
                    onError={onError}
                />
            )}
        </div>
    );
}
