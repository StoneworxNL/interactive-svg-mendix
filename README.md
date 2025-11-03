# Interactive / Clickable SVG Mendix Pluggable Widget

Interactive / Clickable SVG Mendix Pluggable Widget that allows any SVG to trigger Mendix Actions like opening a page,
opening a link, or calling a microflow/nanoflow.

<img alt="Mendix Pluggable Widget Interactive SVG Logo" src="https://github.com/joaodelopes/interactive-svg-mendix/blob/main/src/InteractiveSVG.icon.png" width="65px"/>

![Demo (2)](https://github.com/joaodelopes/interactive-svg-mendix/blob/main/images/demo1.png)

## How To Use

1.  Open your SVG image in an SVG-editor of your choice.
2.  Select (and optionally group) the SVG elements you want to add Mendix actions to.
3.  You need to add metadata to those elements, namely a unique ID for each element. All IDs should start with the same
    prefix (in this example: "mx-svg-").
4.  You can also (optionally) add a CSS class to those clickable elements in case you want to add some hover styling
    later on.

```css
.mx-clickable {
    cursor: pointer;
    &:hover {
        opacity: 0.7;
    }
}
```

5.  Save the SVG image.
6.  Drag and drop the Interactive SVG widget into a web page on your application and fill in all of the required fields.

    1. Set the previously saved image as the "SVG image".
    2. Set your previously defined ID prefix (eg. "mx-svg-") in the "ID Prefix".
    3. Add as many actions as you want. In the ID, set the exact ID of the SVG element you want the action to be
       triggered from (eg. "mx-svg-flashsales"). And the action itself may be a microflow/nanoflow call, opening a
       page...

<img alt="Editing SVG Image" src="https://github.com/joaodelopes/interactive-svg-mendix/blob/main/images/editsvg.png" width="550px"/>
<img alt="Studio Pro (Actions) Configuration" src="https://github.com/joaodelopes/interactive-svg-mendix/blob/main/images/mendixconfig2.png" width="550px"/>

## Demo project

-   [Mendix app running on the cloud](https://world-map-sandbox.mxapps.io/index.html?profile=Responsive)
-   [Mendix demo module (.mpk)](https://github.com/joaodelopes/interactive-svg-mendix/blob/main/demo/InteractiveSVG.mpk)

### Demo

![Demo (1)](https://github.com/joaodelopes/interactive-svg-mendix/blob/main/images/demogif.gif)

## Issues, suggestions and feature requests

Let us know if you find any issues or if you have any feature requests.
