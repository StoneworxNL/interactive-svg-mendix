// import { DynamicValue, WebImage } from "mendix";
// import { ReactElement, createElement } from "react";
// import { ActionsType } from "typings/InteractiveSVGProps";
// import { ReactSVG } from "react-svg";

// export interface HelloWorldSampleProps {
//     svg?: DynamicValue<WebImage>;
//     actions: ActionsType[];
// }

// export function HelloWorldSample({ svg, actions }: HelloWorldSampleProps): ReactElement {
//     if (!svg?.value?.uri) {
//         return <div>No valid SVG image provided</div>;
//     }

//     // Create a map of action callbacks
//     const actionCallbacks: Record<string, () => void> = {};

//     actions.forEach(({ propertyname, propertyvalue }) => {
//         if (propertyvalue && propertyvalue.canExecute) {
//             actionCallbacks[propertyname] = () => propertyvalue.execute();
//         }
//     });

//     return (
//         <ReactSVG
//             src={svg.value.uri}
//             afterInjection={svgElement => {
//                 // Attach click handlers to elements with IDs starting with "mx-svg-"
//                 Object.keys(actionCallbacks).forEach(id => {
//                     if (id.startsWith("mx-svg-")) {
//                         const element = svgElement.getElementById(id);
//                         if (element) {
//                             element.addEventListener("click", actionCallbacks[id]);
//                             (element as HTMLElement).style.cursor = "pointer";
//                         }
//                     }
//                 });
//             }}
//             onError={error => {
//                 console.error("SVG injection error:", error);
//             }}
//         />
//     );
// }

import { DynamicValue, WebImage } from "mendix";
import { ReactElement, createElement } from "react";
import { ActionsType } from "typings/InteractiveSVGProps";
import { ReactSVG } from "react-svg";

export interface HelloWorldSampleProps {
    svg?: DynamicValue<WebImage>;
    actions: ActionsType[];
    prefix: string;
}

export function HelloWorldSample({ svg, actions, prefix }: HelloWorldSampleProps): ReactElement {
    if (!svg?.value?.uri) {
        return <div>No valid SVG image provided</div>;
    }

    const actionCallbacks = actions.reduce<Record<string, () => void>>((acc, { propertyname, propertyvalue }) => {
        if (propertyvalue?.canExecute) {
            acc[propertyname] = () => propertyvalue.execute();
        }
        return acc;
    }, {});

    return (
        <ReactSVG
            src={svg.value.uri}
            afterInjection={(svgElement: SVGElement | null) => {
                if (svgElement) {
                    const elements = svgElement.querySelectorAll(`[id^="${prefix}"]`);
                    elements.forEach(el => {
                        const callback = actionCallbacks[el.id];
                        if (callback) {
                            el.addEventListener("click", callback);
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
