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
    if (values.svg?.type === "dynamic" && values.sanitizemode === "standard") {
        problems.push({
            property: "sanitizemode",
            severity: "warning",
            message:
                "The image comes from an entity, so users may be able to upload it. Set Sanitizing to Strict: Standard keeps <style> blocks, which restyle the whole page."
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
    values.states.forEach((state, index) => {
        const id = state.statename.trim().replace(/^#/, "");
        if (state.stateidentifier === "id__" && /\s/.test(id)) {
            problems.push({
                property: `states/${index + 1}/statename`,
                message: `Element state ${
                    index + 1
                }: an ID cannot contain spaces ("${id}"). Use "Class Name" to match several classes.`
            });
        }
    });
    if (values.triggeredelement && !values.actions.length) {
        problems.push({
            property: "triggeredelement",
            severity: "warning",
            message: "Triggered element is only set when an action runs; add an action."
        });
    }
    return problems;
}
