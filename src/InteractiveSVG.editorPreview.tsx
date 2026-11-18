import { ReactElement } from "react";
import classNames from "classnames";
import { InteractiveSVGPreviewProps } from "../typings/InteractiveSVGProps";

export function preview({ class: className, styleObject, svg }: InteractiveSVGPreviewProps): ReactElement {
    return (
        <div className={classNames("widget-interactive-svg", className)} style={styleObject}>
            {svg?.type === "static" && svg.imageUrl ? (
                <img src={svg.imageUrl} alt="" style={{ maxWidth: "100%" }} />
            ) : (
                <div className="widget-interactive-svg-placeholder">
                    {svg?.type === "dynamic"
                        ? `Interactive SVG (image from ${svg.entity})`
                        : "Interactive SVG: select an SVG image"}
                </div>
            )}
        </div>
    );
}

export function getPreviewCss(): string {
    return require("./ui/InteractiveSVG.css");
}
