# Changelog

## 1.2.0

### Added

-   Interaction types Mouse Down, Right-click (suppresses the browser menu) and Long press (500 ms, the click of the
    same release does not run).
-   Triggered element: a String attribute that receives the triggering element's `data-value`, or else its ID, before
    the action runs.
-   Element states: add classes to SVG elements while a Boolean expression is true.
-   Sanitizing setting with a Strict mode for uploaded SVGs: removes `<style>` blocks, CSS that loads external resources
    (also when written with escapes, comments or `image-set`), external image and filter sources, and links that leave
    the page.
-   Studio Pro warns when the image comes from an entity and Sanitizing is Standard.
-   Studio Pro category (Display) and help link.

### Changed

-   Actionable elements get the class `interactive-svg-actionable` (pointer cursor, no iOS long-press callout) instead
    of an inline cursor style.
-   `aria-label` is managed like `tabindex` and `role`: removed again when its text becomes empty, and a label the SVG
    defines itself is kept.
-   When Triggered element is read-only for the user, the action does not run (it would act on the previous value).
-   Local `<use>` references are kept; sanitizing fails closed; held-down Enter no longer repeats the action; SVGs with
    a `viewBox` scale to their container.

## 1.1.0

### Fixed

-   ID actions on `<path>`, gradient and similar elements never fired, because react-svg renamed their IDs.
-   One invalid name removed the whole image; names are now matched with attribute selectors.
-   The image never updated after the first value.
-   Actions were bound once from a snapshot, ignoring later `canExecute` and `isExecuting` changes.
-   The Studio Pro Class and Style settings were ignored.

### Added

-   SVG sanitizing with DOMPurify, keyboard and screen reader support, Studio Pro preview and checks, unit tests.

### Changed

-   Package size reduced from 1.57 MB to about 85 KB.

## 1.0.1

-   Initial release.
