import { InteractiveSVGPreviewProps } from "../typings/InteractiveSVGProps";

export type Problem = {
    property?: string; // key of the property, at which the problem exists
    severity?: "error" | "warning" | "deprecation"; // default = "error"
    message: string; // description of the problem
    studioMessage?: string; // studio-specific message, defaults to message
    url?: string; // link with more information about the problem
    studioUrl?: string; // studio-specific link
};

export function check(values: InteractiveSVGPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (!values.svg) {
        problems.push({
            property: "svg",
            severity: "warning",
            message: "Select an SVG image; the widget renders nothing without one."
        });
    }
    values.actions.forEach((action, index) => {
        const id = action.propertyname.trim().replace(/^#/, "");
        if (action.propertyidentifier === "id__" && /\s/.test(id)) {
            problems.push({
                property: `actions/${index + 1}/propertyname`,
                message: `Action ${
                    index + 1
                }: an ID cannot contain spaces ("${id}"). Use "Class Name" to match several classes.`
            });
        }
    });
    return problems;
}
