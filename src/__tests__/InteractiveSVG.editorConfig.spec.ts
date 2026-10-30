import { check } from "../InteractiveSVG.editorConfig";
import { InteractiveSVGPreviewProps } from "../../typings/InteractiveSVGProps";

function values(overrides: Partial<InteractiveSVGPreviewProps>): InteractiveSVGPreviewProps {
    return {
        svg: { type: "static", imageUrl: "img.svg" },
        sanitizemode: "standard",
        actions: [],
        states: [],
        triggeredelement: "",
        ...overrides
    } as unknown as InteractiveSVGPreviewProps;
}

describe("check", () => {
    it("warns when an image from an entity is sanitized with Standard", () => {
        const problems = check(values({ svg: { type: "dynamic", entity: "MyModule.Drawing" } }));
        expect(problems).toContainEqual(expect.objectContaining({ property: "sanitizemode", severity: "warning" }));
    });

    it("accepts Strict for an image from an entity and Standard for a static image", () => {
        expect(check(values({ svg: { type: "dynamic", entity: "MyModule.Drawing" }, sanitizemode: "strict" }))).toEqual(
            []
        );
        expect(check(values({}))).toEqual([]);
    });
});
