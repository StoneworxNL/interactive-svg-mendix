# Interactive / Clickable SVG Mendix Pluggable Widget

Interactive / Clickable SVG Mendix Pluggable Widget that allows any SVG to trigger Mendix Actions like opening a page,
opening a link, or calling a microflow/nanoflow.

<img alt="Mendix Pluggable Widget Interactive SVG Logo" src="https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/src/InteractiveSVG.icon.png" width="65px"/>

![Demo (2)](https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/images/demo1.png)

## Why Do I Need This?

The use-case would be: your client or partner provides you with a complex image / diagram / etc... and says: "I want this as the homepage banner and I want different parts of this image to trigger different actions. Part A needs to forward the user to url "xyz", Part B needs to open a modal do create object "abc", Part C needs triggers the microflow "asd", Part D opens the Workflow Management Page." And so on... 
In summary, you have a complex image with different elements. Each element may trigger actions. 
This widget allows for you to be in full control of those inner elements and the actions they may trigger.

## How To Use

### Prepare Your SVG Image

1.  Open your SVG image in an SVG-editor of your choice (an offline editor is, for example, Inkscape, and an online-one could be, for example, Boxy-svg)
2.  Select (and optionally group) the SVG elements you want to add Mendix actions to.
3.  You need to add metadata to those elements, namely a unique ID for each element. All IDs should start with the same
    prefix (in this example: "mx-svg-").
4.  Save the SVG image and have it available in your Mendix application, either as a static image or dynamic.

<img alt="Group SVG Elements" src="https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/images/group.png" width="550px"/>
<img alt="Editing SVG Image" src="https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/images/editsvg.png" width="550px"/>

### Embed It In Mendix

Drag and drop the Interactive SVG widget into a web page on your application and fill in all of the required fields. Then:

1. Set the previously saved image as the "SVG image".
2. Set your previously defined ID prefix (eg. "mx-svg-") in the "ID Prefix".
3. Add as many actions as you want. In the ID, set the exact ID of the SVG element you want the action to be
       triggered from (eg. "mx-svg-flashsales"). And the action itself may be a microflow/nanoflow call, opening a
       page...

<img alt="Studio Pro (Actions) Configuration" src="https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/images/mendixconfig2.png" width="550px"/>

### What if I want to style those SVG elements (eg: on-hover behaviours)?

Using the chosen SVG editor, you can (optionally) add a CSS class to those elements in case you want to add some hover styling later on. Then, in mendix, you define the class(es). Example shown below:

```css
.mx-clickable {
    cursor: pointer;
    &:hover {
        opacity: 0.7;
    }
}
```

## Demo project

-   [Mendix app running on the cloud](https://clickablesvg-sandbox.mxapps.io/index.html?profile=Responsive)
-   [Mendix demo module (.mpk)](https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/demo/InteractiveSVG.mpk)

### Demo

![Demo (1)](https://github.com/StoneworxNL/interactive-svg-mendix/blob/main/images/demogif.gif)

## Issues, suggestions and feature requests

Let us know if you find any issues or if you have any feature requests.
