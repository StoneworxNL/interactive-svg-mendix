import "@testing-library/jest-dom";
import { ActionValue, DynamicValue, EditableValue, WebImage } from "mendix";
import { act, fireEvent, render, RenderResult } from "@testing-library/react";
import { ReactSVG } from "react-svg";
import { ActionsType, StatesType } from "../../../typings/InteractiveSVGProps";
import { ACTIONABLE_CLASS, InteractiveSVGComponent, InteractiveSVGComponentProps } from "../InteractiveSVGComponent";

// Stands in for react-svg without network access: parses the SVG, then calls the hooks in the same order
// as the real injector (beforeInjection on the detached SVG, insert, afterInjection). Like the real one, it
// re-injects whenever a prop changes, so unstable callbacks would show up as lost listeners.
const mockSvgSources: Record<string, string> = {};
jest.mock("react-svg", () => {
    const { createElement, useEffect, useRef } = jest.requireActual("react");
    return {
        ReactSVG: jest.fn(
            ({
                src,
                beforeInjection,
                afterInjection
            }: { src: string } & Record<string, (svg: SVGSVGElement) => void>) => {
                const ref = useRef(null);
                useEffect(() => {
                    const svg = new DOMParser().parseFromString(mockSvgSources[src], "image/svg+xml")
                        .documentElement as unknown as SVGSVGElement;
                    beforeInjection?.(svg);
                    const wrapper = ref.current as unknown as HTMLElement;
                    wrapper.replaceChildren(svg);
                    afterInjection?.(svg);
                    return () => wrapper.replaceChildren();
                }, [src, beforeInjection, afterInjection]);
                return createElement("div", { ref });
            }
        )
    };
});

mockSvgSources["shapes.svg"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><linearGradient id="grad"><stop offset="0" stop-color="#f0f" /></linearGradient></defs>
    <path id="shape" d="M0 0 H10 V10 Z" fill="url(#grad)" />
    <rect id="1st" width="10" height="10" />
    <circle class="dot big" r="5" />
    <circle class="dot" r="3" />
    <g id="grp"><circle r="2" /></g>
    <rect id="own" tabindex="-1" role="img" width="5" height="5" />
    <rect id="valued" class="step done" data-value="step-2" width="5" height="5" />
</svg>`;
mockSvgSources["other.svg"] = `<svg xmlns="http://www.w3.org/2000/svg"><rect id="other" width="5" height="5" /></svg>`;
mockSvgSources["external.svg"] = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <style>@import url(https://evil.example/a.css);</style>
    <defs><symbol id="sym"><rect width="1" height="1" /></symbol></defs>
    <use id="local" href="#sym" />
    <use id="localx" xlink:href="#sym" />
    <use id="remote" href="https://evil.example/x.svg#a" />
    <image id="pixel" href="https://evil.example/p.png" />
    <image id="embedded" href="data:image/png;base64,iVBORw0KGgo=" />
    <rect id="styled" style="fill: url(https://evil.example/f)" />
    <rect id="painted" fill="url(#sym)" />
    <a id="out" href="https://example.com"><text>z</text></a>
</svg>`;
mockSvgSources["unsafe.svg"] = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <style>.glow { fill: red; }</style>
    <script>window.pwned = true;</script>
    <g id="safe" class="glow" style="opacity: 0.5" onmouseover="window.pwned = true"><circle r="4" /></g>
    <a id="link" href="javascript:alert(1)"><text>x</text></a>
    <a id="xlink" xlink:href="javascript:alert(1)"><text>y</text></a>
    <foreignObject id="html"><img src="x" onerror="window.pwned = true" /></foreignObject>
</svg>`;

type Options = { canExecute?: boolean; isExecuting?: boolean };

function actionValue({ canExecute = true, isExecuting = false }: Options = {}): ActionValue {
    return { canExecute, isExecuting, isAuthorized: true, execute: jest.fn() } as unknown as ActionValue;
}

function image(uri?: string, status: "available" | "loading" | "unavailable" = "available"): DynamicValue<WebImage> {
    return { status, value: uri ? { uri } : undefined } as unknown as DynamicValue<WebImage>;
}

function text(value?: string): DynamicValue<string> {
    return { status: value === undefined ? "loading" : "available", value } as unknown as DynamicValue<string>;
}

function action(
    propertyname: string,
    propertytype: ActionsType["propertytype"] = "click",
    options: Options & { byClass?: boolean; label?: string } = {}
): ActionsType {
    return {
        propertyidentifier: options.byClass ? "class__" : "id__",
        propertyname,
        propertytype,
        arialabeltext: "label" in options ? text(options.label) : undefined,
        propertyvalue: actionValue(options)
    };
}

function renderWidget(
    props: Partial<InteractiveSVGComponentProps> & { actions: ActionsType[] }
): RenderResult & { byId: (id: string) => SVGElement } {
    const result = render(<InteractiveSVGComponent svg={image("shapes.svg")} {...props} />);
    const byId = (id: string): SVGElement => result.container.querySelector(`[id="${id}"]`) as SVGElement;
    return { ...result, byId };
}

function state(statename: string, stateclass: string, condition: boolean | undefined, byClass = false): StatesType {
    return {
        stateidentifier: byClass ? "class__" : "id__",
        statename,
        stateclass,
        statecondition: { status: condition === undefined ? "loading" : "available", value: condition }
    } as unknown as StatesType;
}

function attribute(readOnly = false): EditableValue<string> {
    return { readOnly, value: undefined, setValue: jest.fn() } as unknown as EditableValue<string>;
}

const executed = (a: ActionsType): number => (a.propertyvalue!.execute as jest.Mock).mock.calls.length;

beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    delete (window as { pwned?: boolean }).pwned;
});

describe("InteractiveSVGComponent", () => {
    it("keeps the SVG's own IDs by turning off react-svg's ID renumbering", () => {
        renderWidget({ actions: [] });
        expect(jest.mocked(ReactSVG).mock.calls[0][0]).toMatchObject({ renumerateIRIElements: false });
    });

    it("binds IDs and class names, including names that are not valid CSS selectors", () => {
        const actions = [
            action("shape"),
            action("1st"),
            action("#grp"),
            action(".dot", "dblclick", { byClass: true }),
            action("dot big", "mouseenter", { byClass: true })
        ];
        const { byId, container } = renderWidget({ actions });

        fireEvent.click(byId("shape"));
        fireEvent.click(byId("1st"));
        fireEvent.click(byId("grp"));
        container.querySelectorAll(".dot").forEach(dot => fireEvent.doubleClick(dot));
        container.querySelectorAll(".dot").forEach(dot => fireEvent.mouseEnter(dot));

        expect(actions.map(executed)).toEqual([1, 1, 1, 2, 1]);
    });

    it("warns about names that match nothing and still binds the other actions", () => {
        const actions = [action("missing"), action("shape")];
        const { byId } = renderWidget({ actions });

        fireEvent.click(byId("shape"));

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
        expect(executed(actions[1])).toBe(1);
    });

    it("runs every action on an element, honouring canExecute and isExecuting at event time", () => {
        const actions = [
            action("grp", "click", { canExecute: false }),
            action("grp"),
            action("grp", "mouseup", { isExecuting: true })
        ];
        const { byId, rerender } = renderWidget({ actions });

        fireEvent.click(byId("grp"));
        fireEvent.mouseUp(byId("grp"));
        expect(actions.map(executed)).toEqual([0, 1, 0]);

        const updated = [action("grp"), actions[1], actions[2]];
        rerender(<InteractiveSVGComponent svg={image("shapes.svg")} actions={updated} />);
        fireEvent.click(byId("grp"));
        expect(executed(updated[0])).toBe(1);
    });

    it("sets aria-label once its text has loaded", () => {
        const { byId, rerender } = renderWidget({ actions: [action("shape", "click", { label: undefined })] });
        expect(byId("shape").hasAttribute("aria-label")).toBe(false);

        rerender(
            <InteractiveSVGComponent
                svg={image("shapes.svg")}
                actions={[action("shape", "click", { label: "Open details" })]}
            />
        );
        expect(byId("shape").getAttribute("aria-label")).toBe("Open details");
    });

    it("makes executable elements focusable buttons and undoes it when they can no longer execute", () => {
        const { byId, rerender } = renderWidget({
            tabIndex: 3,
            actions: [action("shape"), action("grp", "mouseenter"), action("1st", "click", { canExecute: false })]
        });
        expect(byId("shape")).toHaveAttribute("tabindex", "3");
        expect(byId("shape")).toHaveAttribute("role", "button");
        expect(byId("grp")).toHaveAttribute("tabindex", "3");
        expect(byId("grp")).not.toHaveAttribute("role");
        expect(byId("1st")).not.toHaveAttribute("tabindex");

        rerender(
            <InteractiveSVGComponent
                svg={image("shapes.svg")}
                actions={[action("shape", "click", { canExecute: false })]}
            />
        );
        expect(byId("shape")).not.toHaveAttribute("tabindex");
        expect(byId("shape")).not.toHaveAttribute("role");
    });

    it("leaves tabindex and role the SVG defines itself", () => {
        const { byId, rerender } = renderWidget({ actions: [action("own")] });
        expect(byId("own")).toHaveAttribute("tabindex", "-1");
        expect(byId("own")).toHaveAttribute("role", "img");

        rerender(
            <InteractiveSVGComponent
                svg={image("shapes.svg")}
                actions={[action("own", "click", { canExecute: false })]}
            />
        );
        expect(byId("own")).toHaveAttribute("tabindex", "-1");
        expect(byId("own")).toHaveAttribute("role", "img");
    });

    it("runs the first kind of click action on Enter or Space", () => {
        const actions = [action("shape", "mouseup"), action("shape"), action("grp", "dblclick")];
        const { byId } = renderWidget({ actions });

        fireEvent.keyDown(byId("shape"), { key: "Enter" });
        fireEvent.keyDown(byId("shape"), { key: " " });
        fireEvent.keyDown(byId("grp"), { key: "Enter" });
        fireEvent.keyDown(byId("grp"), { key: "a" });

        expect(actions.map(executed)).toEqual([0, 2, 1]);
    });

    it("treats keyboard focus and blur as hover and mouse leave", () => {
        const actions = [action("grp", "mouseenter"), action("grp", "mouseleave")];
        const { byId } = renderWidget({ actions });

        act(() => (byId("grp") as unknown as HTMLElement).focus());
        act(() => (byId("grp") as unknown as HTMLElement).blur());

        expect(actions.map(executed)).toEqual([1, 1]);
    });

    it("strips script, event handlers, javascript: links and foreignObject but keeps ids, classes and styles", () => {
        const { byId, container } = renderWidget({ svg: image("unsafe.svg"), actions: [action("safe")] });

        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("foreignObject, foreignobject")).toBeNull();
        expect(byId("safe")).not.toHaveAttribute("onmouseover");
        expect(byId("link")).not.toHaveAttribute("href");
        expect(byId("xlink").getAttribute("xlink:href")).toBeNull();
        expect(byId("safe")).toHaveClass("glow");
        expect(byId("safe").getAttribute("style")).toContain("opacity");
        expect(container.querySelector("style")?.textContent).toContain(".glow");

        fireEvent.mouseOver(byId("safe"));
        expect((window as { pwned?: boolean }).pwned).toBeUndefined();
    });

    it("applies Studio Pro class and style to the widget root", () => {
        const { container } = renderWidget({ className: "mx-name-svg1 custom", style: { width: 200 }, actions: [] });
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass("widget-interactive-svg", "mx-name-svg1", "custom");
        expect(root.style.width).toBe("200px");
    });

    it("follows image changes, keeps the image while loading and renders nothing when unavailable", () => {
        const actions = [action("other")];
        const { byId, container, rerender } = renderWidget({ actions });

        rerender(<InteractiveSVGComponent svg={image("other.svg")} actions={actions} />);
        expect(byId("other")).not.toBeNull();
        fireEvent.click(byId("other"));
        expect(executed(actions[0])).toBe(1);

        rerender(<InteractiveSVGComponent svg={image("other.svg", "loading")} actions={actions} />);
        expect(byId("other")).not.toBeNull();

        rerender(<InteractiveSVGComponent svg={image(undefined, "unavailable")} actions={actions} />);
        expect(container.querySelector("svg")).toBeNull();
        expect(container.textContent).toBe("");
    });

    it("runs mouse down and right-click actions, suppressing the browser's context menu", () => {
        const actions = [action("shape", "mousedown"), action("grp", "contextmenu")];
        const { byId } = renderWidget({ actions });

        fireEvent.mouseDown(byId("shape"));
        const notCancelled = fireEvent.contextMenu(byId("grp"));

        expect(actions.map(executed)).toEqual([1, 1]);
        expect(notCancelled).toBe(false);
    });

    describe("long press", () => {
        beforeEach(() => jest.useFakeTimers());
        afterEach(() => jest.useRealTimers());

        it("runs after holding still, and the click of that release does not run", () => {
            const actions = [action("shape", "longpress"), action("shape")];
            const { byId } = renderWidget({ actions });

            fireEvent.pointerDown(byId("shape"));
            act(() => jest.advanceTimersByTime(499));
            expect(executed(actions[0])).toBe(0);
            act(() => jest.advanceTimersByTime(1));
            fireEvent.pointerUp(byId("shape"));
            fireEvent.click(byId("shape"));
            expect(actions.map(executed)).toEqual([1, 0]);

            // A short press afterwards is a normal click again
            fireEvent.pointerDown(byId("shape"));
            fireEvent.pointerUp(byId("shape"));
            fireEvent.click(byId("shape"));
            act(() => jest.advanceTimersByTime(1000));
            expect(actions.map(executed)).toEqual([1, 1]);
        });

        it("is cancelled when the pointer leaves", () => {
            const actions = [action("shape", "longpress")];
            const { byId } = renderWidget({ actions });

            fireEvent.pointerDown(byId("shape"));
            fireEvent.pointerLeave(byId("shape"));
            act(() => jest.advanceTimersByTime(1000));

            expect(executed(actions[0])).toBe(0);
        });
    });

    it("ignores held-down Enter repeats", () => {
        const actions = [action("shape")];
        const { byId } = renderWidget({ actions });

        fireEvent.keyDown(byId("shape"), { key: "Enter" });
        fireEvent.keyDown(byId("shape"), { key: "Enter", repeat: true });

        expect(executed(actions[0])).toBe(1);
    });

    it("reports the triggering element's data-value, or else its ID, before the action runs", () => {
        const triggered = attribute();
        const actions = [action("step", "click", { byClass: true }), action("shape")];
        const order: string[] = [];
        jest.mocked(triggered.setValue).mockImplementation(v => order.push(`set ${v}`));
        jest.mocked(actions[1].propertyvalue!.execute).mockImplementation(() => order.push("execute"));
        const { byId } = renderWidget({ actions, triggeredElement: triggered });

        fireEvent.click(byId("valued"));
        fireEvent.click(byId("shape"));

        expect(triggered.setValue).toHaveBeenNthCalledWith(1, "step-2");
        expect(order.slice(-2)).toEqual(["set shape", "execute"]);
    });

    it("leaves a read-only triggered element attribute alone", () => {
        const triggered = attribute(true);
        const actions = [action("shape")];
        const { byId } = renderWidget({ actions, triggeredElement: triggered });

        fireEvent.click(byId("shape"));

        expect(triggered.setValue).not.toHaveBeenCalled();
        expect(executed(actions[0])).toBe(1);
    });

    it("marks elements with a runnable action with a class instead of an inline cursor", () => {
        const { byId, rerender } = renderWidget({ actions: [action("shape")] });
        expect(byId("shape")).toHaveClass(ACTIONABLE_CLASS);
        expect(byId("shape").style.cursor).toBe("");

        rerender(
            <InteractiveSVGComponent
                svg={image("shapes.svg")}
                actions={[action("shape", "click", { canExecute: false })]}
            />
        );
        expect(byId("shape")).not.toHaveClass(ACTIONABLE_CLASS);
    });

    it("adds state classes while their condition is true and keeps the SVG's own classes", () => {
        const render1 = [state("shape", "active highlighted", true), state("step", "done", true, true)];
        const { byId, rerender } = renderWidget({ actions: [], states: render1 });
        expect(byId("shape")).toHaveClass("active", "highlighted");
        expect(byId("valued")).toHaveClass("step", "done");

        const render2 = [state("shape", "active highlighted", false), state("step", "done", false, true)];
        rerender(<InteractiveSVGComponent svg={image("shapes.svg")} actions={[]} states={render2} />);
        expect(byId("shape")).not.toHaveClass("active");
        expect(byId("shape")).not.toHaveClass("highlighted");
        // "done" is part of the SVG itself, so it stays
        expect(byId("valued")).toHaveClass("step", "done");

        rerender(
            <InteractiveSVGComponent
                svg={image("shapes.svg")}
                actions={[]}
                states={[state("shape", "active", undefined)]}
            />
        );
        expect(byId("shape")).not.toHaveClass("active");
    });

    it("keeps local <use> references and drops external ones", () => {
        const { byId } = renderWidget({ svg: image("external.svg"), actions: [] });

        expect(byId("local")).toHaveAttribute("href", "#sym");
        expect(byId("localx").getAttribute("xlink:href")).toBe("#sym");
        expect(byId("remote")).not.toHaveAttribute("href");
        // Standard mode keeps styles and external images
        expect(byId("pixel")).toHaveAttribute("href");
    });

    it("removes style blocks and external resources in strict mode", () => {
        const { byId, container } = renderWidget({ svg: image("external.svg"), actions: [], sanitizeMode: "strict" });

        expect(container.querySelector("style")).toBeNull();
        expect(byId("pixel")).not.toHaveAttribute("href");
        expect(byId("embedded")).toHaveAttribute("href");
        expect(byId("styled")).not.toHaveAttribute("style");
        expect(byId("painted")).toHaveAttribute("fill", "url(#sym)");
        expect(byId("out")).toHaveAttribute("href", "https://example.com");
        expect(byId("local")).toHaveAttribute("href", "#sym");
    });
});
