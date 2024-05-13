function scrollToCardByIndex(cardIndex, container) {
    try {
        const cardToScroll = container.querySelector(`.card[data-index="${cardIndex}"]`);
        if (cardToScroll) {
            cardToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
            container.querySelectorAll('.card').forEach(card => {
                card.classList.remove('card-focused');
            });
            cardToScroll.classList.add('card-focused');
        } else {
            console.error('Card not found for index:', cardIndex, container);
        }
    } catch (error) {
        console.error("Error occured when scrolling: ", error);
    }
}

function deleteCard(cardIndex, container, countElement, appendText) {
    const card = container.querySelector(`.card[data-index="${cardIndex}"]`);

    // If the card exists, remove it from the DOM
    if (card) {
        card.remove();
    }
    updateCardsCount(container, countElement, appendText);
}

function searchCards(searchText, container, countElement, appendText) {
    var filteredCardIndices = new Set();
    searchText = searchText.toLowerCase(); // Convert input text to lowercase for case-insensitive comparison
    const cards = container.querySelectorAll('.card'); // Get card elements within the container

    // Loop through each card
    cards.forEach(card => {
        // Get the card's text content
        const cardText = card.textContent.toLowerCase();

        // If the card text contains the search text, display the card; otherwise, hide it
        if (cardText.includes(searchText)) {
            card.style.display = 'block'; // Show the card
            filteredCardIndices.add(card.dataset.index);
        } else {
            card.style.display = 'none'; // Hide the card
        }
    });

    // Update the count of displayed cards
    updateCardsCount(container, countElement, appendText);
    return filteredCardIndices;
}

function clearAllCards(container, countElement, appendText) {
    container.innerHTML = '';
    updateCardsCount(container, countElement, appendText);
}

function updateCardsCount(container, countElement, appendText) {
    const visibleCards = Array.from(container.querySelectorAll('.card')).filter(card => window.getComputedStyle(card).display !== 'none');
    const cardCount = visibleCards.length;
    countElement.textContent = cardCount + appendText;
}

function scrollToTop(container) {
    const firstCard = container.querySelector('.card');
    if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function getMaxId(targetData, idFieldName) {
    var maxId = 0;
    targetData.forEach(function(item) {
        if (item[idFieldName] > maxId) {
            maxId = item[idFieldName];
        }
    });
    return maxId;
}


// CP Cards
function generateCPCards(jsonData, container, countElement, appendText, allowEdit=true, showOverlay=true, allowDrag=false, showEditButton=false) {
    // Loop through jsonData and create a card for each marker
    Object.values(jsonData).forEach((markerData)=> {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-index', markerData['id']);
        card.setAttribute('draggable', allowDrag);
        
        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const titleData = ['House', 'Street', 'Alias', 'Postal_Code'];
        titleData.forEach((property, index) => {
            const span = document.createElement('span');
            span.textContent = markerData[property] || '';
            cardTitle.appendChild(span);

            // Add space after each item except the last one
            if (index < titleData.length - 1) {
                cardTitle.appendChild(document.createTextNode(' '));
            }
        });

        // Add closing parentheses after Alias
        const lastProperty = titleData[titleData.length - 1];
        if (lastProperty == 'Alias') {
            const parentheses = document.createElement('span');
            parentheses.textContent = ')';
            cardTitle.appendChild(parentheses);
        }


        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const bodyData = ['Premises', 'Tonnage_kg', 'Vehicle_Type_Allowed', 'Network_Cluster'];
        bodyData.forEach(property => {
            const div = document.createElement('div');
            div.classList.add('cp-card-row-item');
            if (property == 'Tonnage_kg') {
                div.textContent = markerData[property] ? markerData[property] + " kg" : ''; 
            } else if (property == 'Network_Cluster') {
                div.textContent = markerData[property] ? clusters_data.find(cluster => cluster['Cluster_ID'] == markerData[property])['Cluster_Name'] : 'No Cluster'; 
            } else {
                div.textContent = markerData[property] || '';
            }
            cardBody.appendChild(div);
        });

        const cpRouteText = document.createElement('div');
        var cpRoute = routes_data.find(route => route['id'] == markerData['Route_ID']);
        if (!cpRoute) {
            cpRoute = routes_data.find(route => route['Name'] == markerData['Route_ID']);
        }
        cpRouteText.textContent = `${cpRoute['Name'] ? cpRoute['Name'] : ''}`;
        cpRouteText.classList.add('cp-card-row-item');
        cardBody.appendChild(cpRouteText);

        card.addEventListener('click', function() {
            container.querySelectorAll('.card').forEach(card => {
                card.classList.remove('card-focused');
            });
            card.classList.add('card-focused');
        });

        if (showOverlay) {
            // Add click event listener to focusMarker function
            card.addEventListener('click', function() {
                $('#btn-cancel-cp').off('click');
                $('#btn-save-cp').off('click');
                $('#btn-close-cp-overlay').off('click');
                $('#btn-delete-cp').off('click');
                $('#btn-edit-cp').off('click');

                focusMarker(this.dataset.index, allowEdit);
            });
        }

        if (allowDrag) {
            // Add dragstart event listener to handle dragging
            card.addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('cardIndex', this.dataset.index);
            });
        }

        if (showEditButton) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('btn', 'map-button', 'edit-button'); 
            editButton.setAttribute('type', 'button'); 
            cardBody.appendChild(editButton);
        }

        // Append card to container
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function updateCPCardContent(cardIndex, newData, container) {
    // Get the card element by its index within the container
    const card = container.querySelector(`.card[data-index="${cardIndex}"]`);

    if (card) {
        // Update the title content
        const titleElement = card.querySelector('.card-title');
        titleElement.innerHTML = ''; // Clear existing content

        // Populate card title with data
        const titleData = ['House', 'Street', 'Alias', 'Postal_Code'];
        titleData.forEach((property, index) => {
            const span = document.createElement('span');
            span.textContent = newData[property] || '';
            titleElement.appendChild(span);

            // Add space after each item except the last one
            if (index < titleData.length - 1) {
                titleElement.appendChild(document.createTextNode(' '));
            }
        });

        // Add closing parentheses after Alias
        const lastProperty = titleData[titleData.length - 1];
        if (lastProperty == 'Alias') {
            const parentheses = document.createElement('span');
            parentheses.textContent = ')';
            titleElement.appendChild(parentheses);
        }

        // Update the body content
        const bodyElement = card.querySelector('.card-body');
        bodyElement.innerHTML = ''; // Clear existing content

        // Populate card body with data
        const bodyData = ['Premises', 'Tonnage_kg', 'Vehicle_Type_Allowed', 'Network_Cluster', 'Route_ID'];
        bodyData.forEach(property => {
            const div = document.createElement('div');
            div.classList.add('cp-card-row-item');
            if (property == 'Tonnage_kg') {
                div.textContent = newData[property] ? newData[property] + " kg" : ''; 
            } else if (property == 'Network_Cluster') {
                div.textContent = newData[property] ? 'Cluster ' + clusters_data.find(cluster => cluster['Cluster_ID'] == newData[property])['Cluster_Name'] : 'No Cluster'; 
            } else if (property == 'Route_ID') {
                div.textContent = newData[property] ? routes_data.find(route => route['id'] == newData['Route_ID'])['Name'] : 'No Route'; 
            } else {
                div.textContent = newData[property] || '';
            }
            bodyElement.appendChild(div);
        });
    } else {
        console.error('Card not found for index:', cardIndex);
    }
}




// Vehicle Type Cards
function generateVehicleTypeCards(vehicle_types_data, container, countElement, appendText) {
    // Loop through jsonData and create a card for each cluster
    vehicle_types_data.forEach(vehicle_type => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', vehicle_type['id']);

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = vehicle_type['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const totalTonnageText = document.createElement('p');
        totalTonnageText.textContent = `Capcity: ${vehicle_type['Capacity']} kg`;
        totalTonnageText.classList.add('cluster-card-row-item');
        cardBody.appendChild(totalTonnageText);

        const clusterCountText = document.createElement('p');
        clusterCountText.textContent = `Range: ${vehicle_type['Range']} km`;
        clusterCountText.classList.add('cluster-card-row-item');
        cardBody.appendChild(clusterCountText);

        // Add click event listener
        card.addEventListener('click', () => {
            Current_Vehicle_Type_ID = vehicle_type['id'];
            container.querySelectorAll('.card').forEach(card => {
                card.classList.remove('card-focused');
            });
            card.classList.add('card-focused');

            // Set values of text fields in the modal with the extracted data
            document.getElementById('input-veh-type-name').value = vehicle_type['Name'];
            document.getElementById('input-veh-type-capacity').value = vehicle_type['Capacity'];
            document.getElementById('input-veh-type-range').value = vehicle_type['Range'];
            $('#veh-type-modal').modal('show');
        });

        // Append card to container
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function updateVehicleTypeCardContent(vehTypeID, newData, container) {
    // Get the card element by its index within the container
    const card = container.querySelector(`.card[data-index="${vehTypeID}"]`);

    if (card) {
        // Clear existing content
        card.innerHTML = '';

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = newData['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const totalTonnageText = document.createElement('p');
        totalTonnageText.classList.add('cluster-card-row-item');
        totalTonnageText.textContent = `Capcity: ${newData['Capacity']} kg`;
        cardBody.appendChild(totalTonnageText);

        const clusterCountText = document.createElement('p');
        clusterCountText.classList.add('cluster-card-row-item');
        clusterCountText.textContent = `Range: ${newData['Range']} km`;
        cardBody.appendChild(clusterCountText);
    } else {
        console.error('Card not found for index:', vehTypeID);
    }
}



// Vehicle Cards
function generateVehicleCards(vehicles_data, container, countElement, appendText, allowEdit=true, showEditButton=false) {
    // Loop through jsonData and create a card for each cluster
    vehicles_data.forEach(vehicle => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', vehicle['id']);

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = vehicle['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        var vehicleType = vehicle_types_data.find(vehicle_type => vehicle_type['id'] == vehicle['Vehicle_Type']);
        const vehTypetext = document.createElement('p');
        vehTypetext.textContent = `Vehicle Type: ${vehicleType['Name'] ? vehicleType['Name'] : ''}`;
        vehTypetext.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTypetext);

        var vehicleRoute = routes_data.find(route => route['id'] == vehicle['Route_ID']);
        const vehRouteText = document.createElement('p');
        vehRouteText.textContent = `Vehicle Route: ${vehicleRoute['Name'] ? vehicleRoute['Name'] : ''}`;
        vehRouteText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehRouteText);

        // const vehTripsText = document.createElement('p');
        // vehTripsText.textContent = `Vehicle Max Trips: ${vehicle['Max_Trips'] ? vehicle['Max_Trips'] : ''}`;
        // vehTripsText.classList.add('cluster-card-row-item');
        // cardBody.appendChild(vehTripsText);

        // const vehManpowerText = document.createElement('p');
        // vehManpowerText.textContent = `Vehicle Manpower: ${vehicle['Manpower'] ? vehicle['Manpower'] : ''}`;
        // vehManpowerText.classList.add('cluster-card-row-item');
        // cardBody.appendChild(vehManpowerText);

        var depot = depots_data.find(depot => depot['id'] == vehicle['Depot']);
        const vehDepotText = document.createElement('p');
        vehDepotText.textContent = `Vehicle Depot: ${depot['Name'] ? depot['Name'] : ''}`;
        vehDepotText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehDepotText);

        if (showEditButton) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('btn', 'map-button', 'edit-button'); 
            editButton.setAttribute('type', 'button'); 
            cardBody.appendChild(editButton);
        }

        if (allowEdit) {
            // Add click event listener
            card.addEventListener('click', () => {
                Current_Vehicle_ID = vehicle['id'];
                container.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('card-focused');
                });
                card.classList.add('card-focused');

                // Set values of text fields in the modal with the extracted data
                document.getElementById('input-vehicle-name').value = vehicle['Name'];
                // document.getElementById('input-vehicle-trips').value = vehicle['Max_Trips'];
                // document.getElementById('input-vehicle-manpower').value = vehicle['Manpower'];
                showVehicleModal();
            });
        }

        // Append card to container
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function updateVehicleCardContent(vehicleID, newData, container) {
    // Get the card element by its index within the container
    const card = container.querySelector(`.card[data-index="${vehicleID}"]`);

    if (card) {
        // Clear existing content
        card.innerHTML = '';

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = newData['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        var vehicleType = vehicle_types_data.find(vehicle_type => vehicle_type['id'] == newData['Vehicle_Type']);
        const vehTypetext = document.createElement('p');
        vehTypetext.classList.add('cluster-card-row-item');
        vehTypetext.textContent = `Vehicle Type: ${vehicleType['Name'] ? vehicleType['Name'] : ''}`;
        cardBody.appendChild(vehTypetext);

        var vehicleRoute = routes_data.find(route => route['id'] == newData['Route_ID']);
        const vehRouteText = document.createElement('p');
        vehRouteText.classList.add('cluster-card-row-item');
        vehRouteText.textContent = `Vehcie Route: ${vehicleRoute['Name'] ? vehicleRoute['Name'] : ''}`;
        cardBody.appendChild(vehRouteText);

        // const vehTripsText = document.createElement('p');
        // vehTripsText.classList.add('cluster-card-row-item');
        // vehTripsText.textContent = `Vehcie Max Trips: ${newData['Max_Trips'] ? newData['Max_Trips'] : ''}`;
        // cardBody.appendChild(vehTripsText);

        // const vehManpowerText = document.createElement('p');
        // vehManpowerText.classList.add('cluster-card-row-item');
        // vehManpowerText.textContent = `Vehcie Manpower: ${newData['Manpower'] ? newData['Manpower'] : ''}`;
        // cardBody.appendChild(vehManpowerText);

        var depot = depots_data.find(depot => depot['id'] == newData['Depot']);
        const vehDepotText = document.createElement('p');
        vehDepotText.classList.add('cluster-card-row-item');
        vehDepotText.textContent = `Vehcie Depot: ${depot['Name'] ? depot['Name'] : ''}`;
        cardBody.appendChild(vehDepotText);
    } else {
        console.error('Card not found for index:', vehicleID);
    }
}



// Route Cards
function generateRouteCards(routes_data, container, countElement, appendText, allowEdit=true, allowDrag=false) {
    // Loop through jsonData and create a card for each cluster
    routes_data.forEach(route => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', route['id']);
        card.setAttribute('data-alladded', false);
        card.setAttribute('draggable', allowDrag);

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = route['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        var depot = depots_data.find(depot => depot['id'] == route['Depot']);
        const routeDepot = document.createElement('p');
        routeDepot.textContent = `Depot: ${depot['Name'] ? depot['Name'] : ''}`;
        routeDepot.classList.add('cluster-card-row-item');
        cardBody.appendChild(routeDepot);

        var vehicleType = vehicle_types_data.find(vehicle_type => vehicle_type['id'] == route['Vehicle_Type']);
        const vehTypetext = document.createElement('p');
        vehTypetext.textContent = `Vehicle Type: ${vehicleType['Name'] ? vehicleType['Name'] : ''}`;
        vehTypetext.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTypetext);

        const vehTripsText = document.createElement('p');
        vehTripsText.textContent = `Vehicle Max Trips: ${route['Max_Trips'] ? route['Max_Trips'] : ''}`;
        vehTripsText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTripsText);

        const vehManpowerText = document.createElement('p');
        vehManpowerText.textContent = `Vehicle Manpower: ${route['Manpower'] ? route['Manpower'] : ''}`;
        vehManpowerText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehManpowerText);

        if (allowEdit) {
            // Add click event listener
            card.addEventListener('click', () => {
                Current_Route_ID = route['id'];
                container.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('card-focused');
                });
                card.classList.add('card-focused');

                // Set values of text fields in the modal with the extracted data
                document.getElementById('input-route-name').value = route['Name'];
                showRouteModal();
            });
        }

        if (allowDrag) {
            // Add dragstart event listener to handle dragging
            card.addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('cardIndex', this.dataset.index);
            });
        }

        // Append card to container
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function updateRouteCardContent(routeID, newData, container) {
    // Get the card element by its index within the container
    const card = container.querySelector(`.card[data-index="${routeID}"]`);

    if (card) {
        // Clear existing content
        card.innerHTML = '';

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = newData['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        var depot = depots_data.find(depot => depot['id'] == newData['Depot']);
        const routeDepot = document.createElement('p');
        routeDepot.classList.add('cluster-card-row-item');
        routeDepot.textContent = `Depot: ${depot['Name'] ? depot['Name'] : ''}`;
        cardBody.appendChild(routeDepot);

        var vehicleType = vehicle_types_data.find(vehicle_type => vehicle_type['id'] == newData['Vehicle_Type']);
        const vehTypetext = document.createElement('p');
        vehTypetext.textContent = `Vehicle Type: ${vehicleType['Name'] ? vehicleType['Name'] : ''}`;
        vehTypetext.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTypetext);

        const vehTripsText = document.createElement('p');
        vehTripsText.textContent = `Vehicle Max Trips: ${newData['Max_Trips'] ? newData['Max_Trips'] : ''}`;
        vehTripsText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTripsText);

        const vehManpowerText = document.createElement('p');
        vehManpowerText.textContent = `Vehicle Manpower: ${newData['Manpower'] ? newData['Manpower'] : ''}`;
        vehManpowerText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehManpowerText);
    } else {
        console.error('Card not found for index:', routeID);
    }
}



// Depot Cards
function generateDepotCards(depots_data, container, countElement, appendText) {
    // Loop through jsonData and create a card for each cluster
    depots_data.forEach(depot => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', depot['id']);

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = depot['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const depotLatText = document.createElement('p');
        depotLatText.textContent = `Lat: ${depot['lat']}`;
        depotLatText.classList.add('cluster-card-row-item');
        cardBody.appendChild(depotLatText);

        const depotLongText = document.createElement('p');
        depotLongText.textContent = `Long: ${depot['long']}`;
        depotLongText.classList.add('cluster-card-row-item');
        cardBody.appendChild(depotLongText);

        // Add click event listener
        card.addEventListener('click', () => {
            Current_Depot_ID = depot['id'];
            container.querySelectorAll('.card').forEach(card => {
                card.classList.remove('card-focused');
            });
            card.classList.add('card-focused');

            // Set values of text fields in the modal with the extracted data
            document.getElementById('input-depot-name').value = depot['Name'];
            document.getElementById('input-depot-lat').value = depot['lat'];
            document.getElementById('input-depot-long').value = depot['long'];
            $('#depot-modal').modal('show');
        });

        // Append card to container
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function updateDepotCardContent(depotID, newData, container) {
    // Get the card element by its index within the container
    const card = container.querySelector(`.card[data-index="${depotID}"]`);

    if (card) {
        // Clear existing content
        card.innerHTML = '';

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = newData['Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const depotLatText = document.createElement('p');
        depotLatText.classList.add('cluster-card-row-item');
        depotLatText.textContent = `Lat: ${newData['lat']}`;
        cardBody.appendChild(depotLatText);

        const depotLongText = document.createElement('p');
        depotLongText.classList.add('cluster-card-row-item');
        depotLongText.textContent = `Long: ${newData['long']}`;
        cardBody.appendChild(depotLongText);
    } else {
        console.error('Card not found for index:', depotID);
    }
}


// Dragging
function dragDropCard(draggedIndex, donorContainer, donorCountElement, doneeContainer, doneeCountElement, appendText) {
    const draggedCard = donorContainer.querySelector(`[data-index="${draggedIndex}"]`);
    // Remove the dragged card from donorContainer
    draggedCard.remove();

    // Append the dragged card to doneeContainer
    if(doneeContainer != donorContainer) {
        doneeContainer.appendChild(draggedCard);
    }

    updateCardsCount(donorContainer, donorCountElement, appendText);
    updateCardsCount(doneeContainer, doneeCountElement, appendText);
}
