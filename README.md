# Interactive SVG Mendix Pluggable Widget

Interactive SVG Mendix Pluggable Widget that allows any SVG to trigger Mendix Actions like opening a page, opening a
link, or calling a microflow/nanoflow.

<img alt="Mendix Pluggable Widget Interactive SVG Logo" src="https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/src/InteractiveSVG.icon.png" width="65px"/>

![Demo](https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/images/demo5.gif)

## Why Do I Need This?

The use-case would be: your client or partner provides you with a complex image, diagram... and says: "I want this as
the homepage banner and I want different parts of this image to trigger different actions."

Part A needs to forward the user to URL "xyz", Part B needs to open a modal to create object "abc", Part C triggers the
microflow "asd", Part D has a certain behaviour on hover... And so on...

In summary, you have a complex image with different elements and each element may trigger actions on click,
double-click, hover...

This widget puts you in full control of those inner elements and the actions they trigger.

## How To Use

### Prepare Your SVG Image

As a prerequisite, you need an SVG to embed in your page. To interact with certain elements of this SVG you must make
sure they are identifiable through a class name or ID.

1.  Open your SVG image in an SVG editor of your choice.
2.  Select (and optionally group) the SVG elements you want to add Mendix actions to.
3.  Add metadata to those elements (class name or ID).

<img alt="Editing SVG Image" src="https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/images/svgcreate.png" width="600px"/>

### Embed It In Mendix

Embed the Interactive SVG widget into your page and configure its properties:

1. SVG Image (add your image);
2. Add Actions. These are configurable interactions that consist of:

    - Property to identify SVG element (ID or Class);
    - The actual Class Name or ID depending on the previous answer. A leading `#` or `.` is fine, and several class
      names separated by spaces match elements that have all of them;
    - Interaction type. This is the type of event: click, double-click, hover, mouse leave, mouse up, mouse down,
      right-click (the browser's own context menu is suppressed) or long press (holding the pointer still for half a
      second, handy on touch screens; the click of that same release does not run);
    - Optional Aria Label (for accessibility);
    - The actual Mendix action (e.g. open page, call microflow, ...).

This is it! If a class name or ID matches nothing in the SVG, the widget logs a warning in the browser console.

### Know Which Element Was Used

Set **Triggered element** to a String attribute of the context object. Before an action runs, the widget writes the
`data-value` attribute of the element that triggered it into that attribute, or the element's ID when it has no
`data-value`. One action can then serve many elements: give every seat of a seat map the class `seat` and a
`data-value`, add one Click action on the class `seat`, and read the attribute in the microflow.

### Let App Data Drive The SVG (Element States)

**Element states** add a class to SVG elements while a condition is true, and remove it again when it is false. Use them
to highlight the selected element, show progress, color items by status, or reveal the next step of a story:

| Class name or ID | Class to add | Condition                              |
| ---------------- | ------------ | -------------------------------------- |
| `chapter-2`      | `visible`    | `$currentObject/Step >= 2`             |
| `seat`           | `dimmed`     | `$currentObject/SelectedSeat != empty` |

Style the classes in your theme, for example `.visible { opacity: 1; transition: opacity 0.4s; }`. Classes that the SVG
itself already defines are never removed.

<img alt="Studio Pro (Page) Configuration" src="https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/images/studiopromain.png" width="600px"/>
<img alt="Studio Pro (Main) Configuration" src="https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/images/studiopro1.png" width="400px"/>
<img alt="Studio Pro (Actions) Configuration" src="https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/images/studiopro2.png" width="400px"/>

### Keyboard And Screen Reader Support

Elements with an action the user can run are added to the tab order, using the widget's Tab index from Studio Pro.

-   Elements with a click, double-click or mouse up action are announced as buttons. Enter or Space runs the element's
    click actions; an element without one runs its double-click actions instead, or else its mouse up actions.
-   Hover and mouse leave actions also run when the element gets or loses keyboard focus.
-   The Aria Label becomes the element's accessible name. Without one, screen readers fall back to a `<title>` inside
    the element, so give each interactive element a label or a title.

`tabindex` and `role` attributes that your SVG already defines are left as they are.

### Styling Hooks

Elements with an action the user can run get the class `interactive-svg-actionable`, which sets the pointer cursor. Use
it for hover styles that only apply while an action is available:

```css
.interactive-svg-actionable:hover {
    opacity: 0.7;
}
```

SVGs with a `viewBox` scale down to fit their container.

### Security

The SVG is inserted into the page as markup, so the widget sanitizes it with
[DOMPurify](https://github.com/cure53/DOMPurify) first. Scripts, event handler attributes (`onclick`, `onmouseover`,
...), `javascript:` links, `<foreignObject>` content and SMIL `<animate>`/`<set>` elements are removed; shapes, IDs,
classes, inline styles and `<style>` blocks are kept. `<use>` is kept only when it points to an element inside the same
SVG.

A `<style>` block in an inline SVG applies to the whole page, and links to images, fonts or stylesheets elsewhere make
the browser contact that server. When users can upload the SVG, set **Sanitizing** to **Strict**: it also removes
`<style>` blocks, CSS `url(...)` values that point outside the SVG, and external image or filter sources (embedded
`data:image` images and links in `<a>` elements are kept). Strict SVGs can still be animated with your theme's CSS.

For animation, use CSS (in a `<style>` block or your theme) or `<animateTransform>` / `<animateMotion>` with `values`
(their `from`/`to` attributes are removed by the sanitizer).

### What If I Want To Style Those SVG Elements (e.g. On-Hover Behaviours)?

Using the chosen SVG editor, you can (optionally) add a CSS class to those elements in case you want to add some hover
styling later on. Then, in Mendix, you define the class(es). Example shown below:

```css
.mx-clickable:hover {
    opacity: 0.7;
}
```

The widget's root element has the class `widget-interactive-svg` plus any class you set in Studio Pro, so you can scope
styles to one widget, for example `.mx-name-interactiveSVG1 svg { border-radius: 16px; }`.

## Demo Project

-   [Mendix app running on the cloud](https://clickablesvg-sandbox.mxapps.io/index.html?profile=Responsive)
-   [Mendix demo module (.mpk)](https://github.com/StoneworxNL/interactive-svg-mendix/raw/main/demo/InteractiveSVG.mpk)

The demo module shows toast messages with the BG Toast module (`BGToast`), so install that from the Mendix Marketplace
before importing the demo module. Its page styling is included in the module's theme (`themesource/interactivesvg`);
`demo/demo.scss` contains the same styles for reference.

### Demo

![Demo](https://raw.githubusercontent.com/StoneworxNL/interactive-svg-mendix/main/images/demo5.gif)

## Development

Requires Node.js 20 or later.

-   `npm run build`: development build, copied into the Mendix app configured in `package.json` (`config.projectPath`);
-   `npm test`: unit tests;
-   `npm run lint`: formatting and lint checks;
-   `npm run release`: runs lint and tests, then writes a minified package to `dist/<version>/`.

## Issues, Suggestions And Feature Requests

Let us know if you find any issues or if you have any feature requests.
