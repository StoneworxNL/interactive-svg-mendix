# Interactive / Clickable SVG Mendix Pluggable Widget

Interactive / Clickable SVG Mendix Pluggable Widget that allows any SVG to trigger Mendix Actions.

<img alt="Mendix Pluggable Widget Interactive SVG Logo" src="https://github.com/joaodelopes/interactive-svg-mendix/blob/main/src/InteractiveSVG.icon.png" width="65px"/>

## How To Use

1. Open your SVG image in an SVG-editor of your choice.
2. Select (and optionally group) the SVG elements you want to add Mendix actions to.
3. You need to add metadata to those elements, namely a unique ID for each element. All IDs should start with the same
   prefix (in this example: "mx-svg-").
   ![Editing Your SVG Image](https://github.com/joaodelopes/interactive-svg-mendix/blob/main/images/edit.svg)
4. You can also optionally add a class to those clickable elements in case you want to add some hover styling later on,
   for example.
5.

<!-- ![Configuration in Studio Pro](https://github.com/StoneworxNL/worldmap-mendix/blob/main/images/config.png) -->

## On Click

<!-- If you want to handle clicks on the map, make sure you create an "onClick" action and set it in the Widget's General
settings. To know which country was clicked:

1. Wrap the World Map widget inside a dataview.
2. Add the "Clicked Country" attribute to know the ISO Code of the clicked country.
3. Add the object in context as an input of the action created in 1.

<img alt="OnClick Configurations" src="https://github.com/StoneworxNL/worldmap-mendix/blob/main/images/demoAction.png" width="550px"/>
<img alt="Microflow Example" src="https://github.com/StoneworxNL/worldmap-mendix/blob/main/images/microflow.png" width="550px"/> -->

## Demo project

-   [Mendix app running on the cloud](https://world-map-sandbox.mxapps.io/index.html?profile=Responsive)
-   [Mendix demo module (.mpk)](https://github.com/StoneworxNL/worldmap-mendix/blob/main/demo/WorldMap.mpk)

You can check the demo [here](https://world-map-sandbox.mxapps.io/index.html?profile=Responsive). Please be mindful of
changing the data, as to keep the demo working for every user.

### Contries' Configuration Example

![Countries Configuration](https://github.com/StoneworxNL/worldmap-mendix/blob/main/images/configcountries.png)

![]

### Demo

![Demo (1)](https://github.com/StoneworxNL/worldmap-mendix/blob/main/images/demo.gif)
![Demo (2)](https://github.com/StoneworxNL/worldmap-mendix/blob/main/images/demoInt.png)

## Issues, suggestions and feature requests

Let us know if you find any issues or if you have any feature requests.
