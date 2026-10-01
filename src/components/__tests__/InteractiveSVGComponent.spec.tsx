import "@testing-library/jest-dom";
import { ActionValue, DynamicValue, WebImage } from "mendix";
import { act, fireEvent, render, RenderResult } from "@testing-library/react";
import { ReactSVG } from "react-svg";
import { ActionsType } from "../../../typings/InteractiveSVGProps";
import { InteractiveSVGComponent, InteractiveSVGComponentProps } from "../InteractiveSVGComponent";

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
</svg>`;
mockSvgSources["other.svg"] = `<svg xmlns="http://www.w3.org/2000/svg"><rect id="other" width="5" height="5" /></svg>`;
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
        expect(byId("safe")).toHaveAttribute("class", "glow");
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
});
