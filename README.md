# Introduction 
This is a flask frontend website for users to quickly edit information before applying the algorithm for route optmization.

Functions are written in pure javascipt as much as possible to run on the client side. 

# Getting Started
1.	`pip install -r requirements.txt`
2.	`python run.py`

# Build and Test
TODO: Describe and show how to build your code and run the tests. 

# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 

# Table of Contents

- [File Structure](#File-Structure)
- [Data](#Data)
- [Cards](#Cards)
- [Map](#map)
- [Calendar](#Calendar)
- [Home](#Home)
- [Page 5](#page-5)

# File Structre
## optimization
Conatins python code for running the solver

## static
Contains the css, data, icons, images, javascript, and custome leaflet markers.

## templates
Contains the html code for each page or component.

## Geotab related files
Contains the code for fetching, processing and returning data from Geotab.

## routes.py
Contains all the endpoints.

## test_run_local.py
Contains test cases to verify that the optimizer works with the data given. Be sure to launch the respective vroom and osrm docker containers before running this.

## run_local.py
Contains the code for launching the project for testing without authentication.

## run.py
Contains the code for launching the project with authentication.

# Data
## Overview
The files in static/js/data serves as a temporary database. There are 6 types of data -- depots_data, vehicle_types_data, routes_data, vehicles_data, points_data, and clusters_data. Each file contains the respective variables. These variables are being loaded in static/templates/layout.html and do not need to be loaded again on each individual page.

## Backup
A backup of each file is stored in static/js/data/original_data. 

## Writing
Endpoints for writing data back to these files can be found in routes.py. To use these endpoints, just call the respective update{name}Data() function found in static/js/templates/layout.js

# Cards
## Overview
This JS file contains function relating to generating, searching, deleting and dragging card components. There are 4 main card types in this file: Collection Point Cards, Vehicle Cards, Vehicle Type Cards, Route Cards, and Depot Cards. Cluster Cards is found in edit_clusters.js instead as it is only used there. Each card type has a generator function to generate new cards and an update function to update existing cards.

## Functionality
Cards display selected information of the data being passed in. Each card has an data-index attribute which holds the index of the data it is displaying. This is to facilitate searching, deletion and dragging operations. 

### scrollToCardByIndex
scrollToCardByIndex searches in the container element for the card element who's data-index attribute matches the cardIndex argument and scrolls it into view.

### deleteCard
deleteCard searches in the container element for the card element who's data-index attribute matches the cardIndex argument and deletes that card element. Then the corresponding countElement is updated with the new count.

### searchCards
searchCards searches in the container element and filters out the card elements which contains the serachText. Then the corresponding countElement is updated with the new count.

### clearAllCards
clearAllCards clears all the cards in the container elemenet.

### updateCArdsCount
updateCArdsCount updates the countElement in the container element.

### scrollToTop
scrollToTop scrolls the first card in the container into view.

### getMaxId
getMaxId returns the biggest ID of the cards in the container. This is used when appending new cards so as to avoid duplicate IDs.

### Generator functions
Generator functions take in 4 main arguments.
1. data - an array of data to iterate over
2. container - the parent html container element to generate the cards in
3. countElement - the accompaying count element in the parent container that reflects the number of cards in that container
4. appendText - the text to append to the count 

### Update functions
Update functions take in 3 arguments.
1. cardIndex - the data-index attribute of the card to search for
2. newData - the data to be used to update the card
3. container - the parnet html container element where the card can be found

# Map
## Overview 
This JS file contains functions related to the leaflet map found on Edit Locations, Edit Clusters and Free Optimization pages.

## Fucntionality
There are 3 types of maps, CP Map for the Edit Locations Page, Cluster Map for the Edit Clusters Page, Run Optimization Map for the Free Optimization Page. Each Map is made of 3 parts -- the map itself, the markers on the map, and the overlay to display information of the markers.

### clearMapLayer
clearMapLayer clears all the markers that were plotted on a certain map layer

### getMaxId
getMaxId returns the maximum ID of all the data, this is useful when appending new data to prevent duplicate IDs.

### findElementById
findElementById finds the element who's ID matches the idToFind. This is just a helper function.

### getColor
getCOlor returns the appropriate colour based on the index given, this is useful when trying to plot markers of different colors such as for clusters.

### Create Map
Creates the map, initialized the appropriate layers, and handles adding of new tempMarker on right-click.

### Plot Markers
Plot the markers on the targetLayer based on the data being passed in, the icon argument can be used to customize the kind of markers being used to plot. "none" uses Leaflet's default markers, only the default markers can be dragged.

### Show Clicked Marker / Foucs Marker
Sets the view of the map such that the clicked marker is in the center.
Updates the content of the overlay wiht the data from the clicked marker, then shows the overlay.
Overlay buttons interactions such as Edit, Delete, Save are handled here. tempMarkers from right-clicking are handled in the seperate sister function.

### Update Overlay
Updates the overaly with the information if the marker. THe data fields here are hard coded so be sure to verify them when changing the column names in the future. tempOverlays from tempMarkers are handled in the seperate sister function.


# Calendar
## Overview
This JS file handles the calendar being shown when users click on the "Plot From Geotab" button on the Edit Locations Page

# Home
## Overview 
HTMl can be found templates/index.html.
There is no Js or Css.

# Simple Optimization