import { DynamicValue, EditableValue, WebImage } from "mendix";
import { CSSProperties, ReactElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import classNames from "classnames";
import DOMPurify, { UponSanitizeAttributeHook } from "dompurify";
import { ActionsType, PropertytypeEnum, SanitizemodeEnum, StatesType } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface InteractiveSVGComponentProps {
    className?: string;
    style?: CSSProperties;
    tabIndex?: number;
    svg?: DynamicValue<WebImage>;
    triggeredElement?: EditableValue<string>;
    actions: ActionsType[];
    states?: StatesType[];
    sanitizeMode?: SanitizemodeEnum;
}

// Pointer interactions that keyboard users trigger with Enter or Space, in order of preference
const ACTIVATION_EVENTS: PropertytypeEnum[] = ["click", "dblclick", "mouseup", "mousedown", "longpress"];

// Lists the attributes the widget added to an element, so they can be removed again without touching the SVG's own
const OWNED_ATTRIBUTES = "data-interactive-svg";

// Added to elements with an action the user can run: shows the pointer cursor and is a hook for hover styling
export const ACTIONABLE_CLASS = "interactive-svg-actionable";

const LONG_PRESS_MS = 500;
const LONG_PRESS_TOLERANCE_PX = 10;

type Identifier = ActionsType["propertyidentifier"];

function quote(value: string): string {
    return `"${value.replace(/["\\]/g, "\\$&")}"`;
}

// Attribute selectors keep any name valid (IDs like "1st" or "a:b" from design tools); a leading "#" or "." is tolerated
function toSelector(identifier: Identifier, rawName: string): string | undefined {
    const name = rawName.trim();
    if (identifier === "class__") {
        const classes = name
            .split(/\s+/)
            .map(c => c.replace(/^\./, ""))
            .filter(Boolean);
        return classes.length > 0 ? classes.map(c => `[class~=${quote(c)}]`).join("") : undefined;
    }
    const id = name.replace(/^#/, "");
    return id ? `[id=${quote(id)}]` : undefined;
}

function findTargets(svgElement: SVGSVGElement, identifier: Identifier, name: string): SVGElement[] {
    const selector = toSelector(identifier, name);
    return selector ? Array.from(svgElement.querySelectorAll<SVGElement>(selector)) : [];
}

const findActionTargets = (svgElement: SVGSVGElement, action: ActionsType): SVGElement[] =>
    findTargets(svgElement, action.propertyidentifier, action.propertyname);

const isLocalReference = (value: string): boolean => value.trim().startsWith("#");
const isEmbeddedImage = (value: string): boolean => /^data:image\/(png|jpe?g|gif|webp|avif);/i.test(value.trim());
// Any url(...) other than a reference to an element of the SVG itself, e.g. url(#gradient)
const EXTERNAL_CSS_URL = /url\(\s*(?!['"]?#)/i;

// <use> is kept so symbols from design tools still render, but only when it points inside the SVG. Strict mode
// also drops everything that would make the browser fetch another resource (tracking pixels, CSS imports...).
function referenceHook(mode: SanitizemodeEnum): UponSanitizeAttributeHook {
    return (node, data) => {
        const tag = node.nodeName.toLowerCase();
        const isLink = data.attrName === "href" || data.attrName === "xlink:href";
        if (isLink && tag === "use" && !isLocalReference(data.attrValue)) {
            data.keepAttr = false;
        }
        if (mode !== "strict") {
            return;
        }
        if (isLink && tag !== "a" && !isLocalReference(data.attrValue) && !isEmbeddedImage(data.attrValue)) {
            data.keepAttr = false;
        }
        if (EXTERNAL_CSS_URL.test(data.attrValue)) {
            data.keepAttr = false;
        }
    };
}

// The SVG is inlined into the page, so strip scripts, event-handler attributes, javascript: links and foreignObject
// content before it is inserted. IDs are kept even when they match DOM property names, as actions rely on them, and
// so is "role", which the SVG profile would otherwise drop.
export function sanitize(svg: SVGElement, mode: SanitizemodeEnum = "standard"): void {
    const hook = referenceHook(mode);
    DOMPurify.addHook("uponSanitizeAttribute", hook);
    try {
        DOMPurify.sanitize(svg, {
            IN_PLACE: true,
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ["use"],
            ADD_ATTR: ["role"],
            FORBID_TAGS: mode === "strict" ? ["style"] : [],
            SANITIZE_DOM: false
        });
    } catch (error) {
        // Fail closed: whatever could not be sanitized is not shown
        console.error("InteractiveSVG: the SVG could not be sanitized and is not shown.", error);
        svg.replaceChildren();
    } finally {
        DOMPurify.removeHook("uponSanitizeAttribute", hook);
    }
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

// What an action reports about the element that triggered it: a designer-chosen data-value, or else the ID
const triggerValue = (target: Element): string => target.getAttribute("data-value") ?? target.id ?? "";

export function InteractiveSVGComponent({
    className,
    style,
    tabIndex,
    svg,
    triggeredElement,
    actions,
    states = [],
    sanitizeMode = "standard"
}: InteractiveSVGComponentProps): ReactElement {
    const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
    const actionsRef = useRef(actions);
    const triggeredElementRef = useRef(triggeredElement);
    // Classes the widget added per element, so only those are ever removed again
    const addedClassesRef = useRef(new Map<Element, Set<string>>());

    // Keep the refs on the latest props after every render, before any listener can read them
    useLayoutEffect(() => {
        actionsRef.current = actions;
        triggeredElementRef.current = triggeredElement;
    });

    // A loading value keeps its previous image, so only a real URI change re-injects the SVG
    const uri = svg?.value?.uri;

    // Callbacks must keep their identity: ReactSVG re-injects the SVG whenever one of its props changes
    const beforeInjection = useCallback((element: SVGSVGElement) => sanitize(element, sanitizeMode), [sanitizeMode]);

    const onAfterInjection = useCallback((element: SVGSVGElement) => {
        addedClassesRef.current = new Map();
        setSvgElement(element);
    }, []);

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
        const listen = (target: Element, type: string, listener: (event: Event) => void): void => {
            target.addEventListener(type, listener);
            cleanups.push(() => target.removeEventListener(type, listener));
        };
        // Resolve by index at event time, so each action runs with its latest canExecute/isExecuting state
        const run = (index: number, target: Element): void => {
            const actionValue = actionsRef.current[index]?.propertyvalue;
            if (actionValue?.canExecute && !actionValue.isExecuting) {
                const attribute = triggeredElementRef.current;
                if (attribute && !attribute.readOnly) {
                    attribute.setValue(triggerValue(target));
                }
                actionValue.execute();
            }
        };

        // A long press is followed by the click of the same pointer release, which should not run as well
        const suppressNextClick = new WeakSet<Element>();
        const actionsByTarget = new Map<Element, number[]>();
        actionsRef.current.forEach((action, index) => {
            const targets = findActionTargets(svgElement, action);
            if (targets.length === 0) {
                console.warn(`InteractiveSVG: no SVG element matches "${action.propertyname}".`);
            }
            targets.forEach(target => {
                actionsByTarget.set(target, [...(actionsByTarget.get(target) ?? []), index]);
                if (action.propertytype === "longpress") {
                    return;
                }
                listen(target, action.propertytype, event => {
                    if (action.propertytype === "click" && suppressNextClick.has(target)) {
                        return;
                    }
                    if (action.propertytype === "contextmenu") {
                        event.preventDefault();
                    }
                    run(index, target);
                });
            });
        });

        actionsByTarget.forEach((indexes, target) => {
            const ofType = (type: PropertytypeEnum): number[] =>
                indexes.filter(i => actionsRef.current[i].propertytype === type);

            const onLongPress = ofType("longpress");
            if (onLongPress.length > 0) {
                let timer: ReturnType<typeof setTimeout> | undefined;
                let start = { x: 0, y: 0 };
                const cancel = (): void => {
                    clearTimeout(timer);
                    timer = undefined;
                };
                listen(target, "pointerdown", event => {
                    const { clientX = 0, clientY = 0, button = 0 } = event as PointerEvent;
                    if (button !== 0) {
                        return;
                    }
                    suppressNextClick.delete(target);
                    start = { x: clientX, y: clientY };
                    cancel();
                    timer = setTimeout(() => {
                        timer = undefined;
                        suppressNextClick.add(target);
                        onLongPress.forEach(i => run(i, target));
                    }, LONG_PRESS_MS);
                });
                listen(target, "pointermove", event => {
                    const { clientX = 0, clientY = 0 } = event as PointerEvent;
                    if (Math.hypot(clientX - start.x, clientY - start.y) > LONG_PRESS_TOLERANCE_PX) {
                        cancel();
                    }
                });
                ["pointerup", "pointerleave", "pointercancel"].forEach(type => listen(target, type, cancel));
                // Touch browsers open their own menu on a long press
                listen(target, "contextmenu", event => event.preventDefault());
                cleanups.push(cancel);
            }

            // Keyboard equivalents: Enter/Space run the element's first kind of click action; keyboard focus and blur
            // stand in for hover and mouse leave. Right-click needs nothing: the context menu key fires contextmenu.
            const activation = ACTIVATION_EVENTS.map(ofType).find(list => list.length > 0);
            if (activation) {
                listen(target, "keydown", event => {
                    const { key, repeat } = event as KeyboardEvent;
                    if (key === "Enter" || key === " ") {
                        event.preventDefault();
                        if (!repeat) {
                            activation.forEach(i => run(i, target));
                        }
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
                        onEnter.forEach(i => run(i, target));
                    }
                });
                listen(target, "blur", () => {
                    if (keyboardFocus) {
                        onLeave.forEach(i => run(i, target));
                    }
                    keyboardFocus = false;
                });
            }
        });
        return () => cleanups.forEach(cleanup => cleanup());
    }, [svgElement, bindingKey]);

    // Runs on every update, so focusability, role, classes and aria-labels follow canExecute, conditions and
    // late-loading text
    useEffect(() => {
        if (!svgElement) {
            return;
        }
        const wantedClasses = new Map<Element, Set<string>>();
        const want = (target: Element, classes: string[]): void => {
            const set = wantedClasses.get(target) ?? new Set<string>();
            classes.forEach(c => set.add(c));
            wantedClasses.set(target, set);
        };

        const targetStates = new Map<SVGElement, { executable: boolean; activatable: boolean; label?: string }>();
        actions.forEach(action => {
            const executable = !!action.propertyvalue?.canExecute;
            findActionTargets(svgElement, action).forEach(target => {
                const state = targetStates.get(target) ?? { executable: false, activatable: false };
                state.executable = state.executable || executable;
                state.activatable =
                    state.activatable || (executable && ACTIVATION_EVENTS.includes(action.propertytype));
                state.label = state.label || action.arialabeltext?.value;
                targetStates.set(target, state);
            });
        });
        targetStates.forEach(({ executable, activatable, label }, target) => {
            if (executable) {
                want(target, [ACTIONABLE_CLASS]);
            }
            setOwnedAttribute(target, "tabindex", executable ? String(tabIndex ?? 0) : undefined);
            setOwnedAttribute(target, "role", activatable ? "button" : undefined);
            if (label) {
                target.setAttribute("aria-label", label);
            }
        });

        states.forEach(state => {
            if (state.statecondition?.value !== true) {
                return;
            }
            const classes = state.stateclass.split(/\s+/).filter(Boolean);
            findTargets(svgElement, state.stateidentifier, state.statename).forEach(target => want(target, classes));
        });

        // Remove what the widget added and no longer wants, then add what is missing; classes the SVG defines stay
        const added = addedClassesRef.current;
        added.forEach((classes, target) => {
            classes.forEach(c => {
                if (!wantedClasses.get(target)?.has(c)) {
                    target.classList.remove(c);
                    classes.delete(c);
                }
            });
        });
        wantedClasses.forEach((classes, target) => {
            classes.forEach(c => {
                if (!target.classList.contains(c)) {
                    target.classList.add(c);
                    added.set(target, (added.get(target) ?? new Set()).add(c));
                }
            });
        });
    });

    return (
        <div className={classNames("widget-interactive-svg", className)} style={style}>
            {uri && (
                <ReactSVG
                    src={uri}
                    // Renumbering renames the IDs of <path>, gradient, clipPath... elements (e.g. "shape" -> "shape-1"),
                    // which would stop ID-based actions from finding them
                    renumerateIRIElements={false}
                    beforeInjection={beforeInjection}
                    afterInjection={onAfterInjection}
                    onError={onError}
                />
            )}
        </div>
    );
}
