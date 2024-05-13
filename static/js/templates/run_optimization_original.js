let pointsToAssignSet = new Set();
let vehiclesInvolvedSet = new Set();
let routesToBreakSet = new Set();
let routesToOptimizeSet = new Set();
let solverConfigMode = "Breakroute";
let isUseClusters = false;

// Fleet Route Points Slider 
function updateFleetRoutePointsSliderPosition() {
    // Calculate the left position for the indicator
    const optionWidth = document.querySelector('.fleet-route-points-option').offsetWidth;
    const optionIndex = Array.from(document.querySelectorAll('.fleet-route-points-option')).findIndex(option => option.classList.contains('option-selected'));
    const leftPosition = optionIndex * optionWidth;

    // Move the indicator smoothly to the selected option
    document.getElementById('fleet-route-points-indicator').style.left = leftPosition + 'px';

    // Move the corresponding column into view
    const newPosition = -optionIndex * 100;
    document.querySelectorAll('.sliding-window-column').forEach(column => {
        column.style.transform = `translateX(${newPosition}%)`;
    });
}

// Solver Config Mode Slider
function updateSolverConfigModeSliderPosition() {
    // Calculate the left position for the indicator
    const optionWidth = document.querySelector('.solver-config-mode-option').offsetWidth;
    const optionIndex = Array.from(document.querySelectorAll('.solver-config-mode-option')).findIndex(option => option.classList.contains('option-selected'));
    const leftPosition = optionIndex * optionWidth;

    // Move the indicator smoothly to the selected option
    document.getElementById('solver-config-mode-indicator').style.left = leftPosition + 'px';
}

function updateAllSliders() {
    updateFleetRoutePointsSliderPosition();
    updateSolverConfigModeSliderPosition();
}

$(document).ready(function () {
    createRunOptimizationMap();
    updateFleetRoutePointsSliderPosition();
    window.addEventListener('resize', updateAllSliders);
    updatePointsAndRoutesCount();

    document.querySelectorAll('.fleet-route-points-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove 'option-selected' class from all options
            document.querySelectorAll('.fleet-route-points-option').forEach(otherOption => {
                otherOption.classList.remove('option-selected');
            });
            option.classList.add('option-selected');

            // Call the function to update slider position
            updateFleetRoutePointsSliderPosition();
        });
    });

    document.querySelectorAll('.solver-config-mode-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove 'option-selected' class from all options
            document.querySelectorAll('.solver-config-mode-option').forEach(otherOption => {
                otherOption.classList.remove('option-selected');
            });
            option.classList.add('option-selected');
            solverConfigMode = option.dataset.mode;

            // Call the function to update slider position
            updateSolverConfigModeSliderPosition();
        });
    });

    // document.getElementById('btn-use-clusters').addEventListener('click', function() {
    //     if (isUseClusters) {
    //         this.textContent = 'Use Clusters';
    //         isUseClusters = false;
    //         this.classList.remove('btn-using-clusters');
    //     } else {
    //         this.textContent = 'Using Clusters';
    //         isUseClusters = true;
    //         this.classList.add('btn-using-clusters');
    //     }
    // })

    document.getElementById('toggle-use-clusters').addEventListener('click', function() {
        var spanElement = this.querySelector('.use-cluster-slider');

        if (isUseClusters) {
            spanElement.textContent = 'Use Clusters';
            isUseClusters = false;
            this.classList.remove('use-clusters-selected');
        } else {
            spanElement.textContent = 'Using Clusters';
            isUseClusters = true;
            this.classList.add('use-clusters-selected');
        }
    });
    

    // Load Vehicles
    generateRunOptimizationVehicleCards(vehicles_data, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles");

    // Search Vehicles
    document.getElementById('input-search-vehicle').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles");
    });

    document.getElementById('input-search-vehicles-involved').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), " Vehicles Involved");
    });

    // Select/Unselect all Vehicles
    document.getElementById('btn-select-all-vehicles').addEventListener('click', function() {
        if (this.dataset.state === "select-all") {
            vehicles_data.forEach(vehicle => {
                if (!vehiclesInvolvedSet.has(String(vehicle['id']))) {
                    vehiclesInvolvedSet.add(String(vehicle['id']));
                    dragDropCard(vehicle['id'], document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), " Vehicles");   
                }
            })
            clearAllCards(document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles Involved");
            this.dataset.state = "unselect-all";
            this.textContent = "Unselect All";
        } else {
            vehiclesInvolvedSet.clear();
            // clearAllCards(document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), " Vehicles Involved");
            // clearAllCards(document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles Involved");
            document.getElementById('vehicles-involved-cards-container').querySelectorAll('.card').forEach(card => {
                dragDropCard(card.dataset.index, document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles");   
            })
            // generateVehicleCards(vehicles_data, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles Involved", false, true);
            this.dataset.state = "select-all";
            this.textContent = "Select All";
        }
    });

    function generateRunOptimizationVehicleCards(vehicles_data, container, countElement, appendText) {
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
            vehRouteText.textContent = `Route: ${vehicleRoute['Name'] ? vehicleRoute['Name'] : ''}`;
            vehRouteText.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehRouteText);

            const vehTripsText = document.createElement('p');
            vehTripsText.textContent = `Max Trips: ${vehicle['Max_Trips'] ? vehicle['Max_Trips'] : ''}`;
            vehTripsText.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehTripsText);

            const vehManpowerText = document.createElement('p');
            vehManpowerText.textContent = `Manpower: ${vehicle['Manpower'] ? vehicle['Manpower'] : ''}`;
            vehManpowerText.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehManpowerText);

            var depot = depots_data.find(depot => depot['id'] == vehicle['Depot']);
            const vehDepotText = document.createElement('p');
            vehDepotText.textContent = `Depot: ${depot['Name'] ? depot['Name'] : ''}`;
            vehDepotText.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehDepotText);

            const vehBreakText = document.createElement('p');
            vehBreakText.textContent = `Break Time: ${vehicle['Break_Time'] ? vehicle['Break_Time'] : ''}`;
            vehBreakText.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehBreakText);

            const vehCurrentLat = document.createElement('p');
            vehCurrentLat.textContent = `Current Lat: ${vehicle['Current_Lat'] ? vehicle['Current_Lat'] : ''}`;
            vehCurrentLat.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehCurrentLat);

            const vehCurrentLong = document.createElement('p');
            vehCurrentLong.textContent = `Current Long: ${vehicle['Current_Long'] ? vehicle['Current_Long'] : ''}`;
            vehCurrentLong.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehCurrentLong);

            const vehCurrentTonnage = document.createElement('p');
            vehCurrentTonnage.textContent = `Current Tonnage: ${vehicle['Current_Tonnage'] ? vehicle['Current_Tonnage'] : ''}`;
            vehCurrentTonnage.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehCurrentTonnage);

            const vehStartTime = document.createElement('p');
            vehStartTime.textContent = `Current Start Time: ${vehicle['Start_Time'] ? vehicle['Start_Time'] : ''}`;
            vehStartTime.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehStartTime);

            const vehEndTime = document.createElement('p');
            vehEndTime.textContent = `Current End Time: ${vehicle['End_Time'] ? vehicle['End_Time'] : ''}`;
            vehEndTime.classList.add('cluster-card-row-item');
            cardBody.appendChild(vehEndTime);

            const vehEditDeleteButtons = document.createElement('p');
            vehEditDeleteButtons.classList.add('edit-delete-btn-container'); 

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('btn', 'edit-button'); 
            editButton.setAttribute('type', 'button'); 
            editButton.addEventListener('click', function(event) {
                event.stopPropagation();

                const vehicle = vehicles_data.find(vehicle => vehicle['id'] == card.dataset.index);
                document.getElementById('input-edit-vehicle-location-lat').value = vehicle['Current_Lat'];
                document.getElementById('input-edit-vehicle-location-long').value = vehicle['Current_Long'];
                document.getElementById('input-edit-vehicle-tonnage').value = vehicle['Current_Tonnage'];
                document.getElementById('input-edit-vehicle-manpower').value = vehicle['Manpower'];
                document.getElementById('input-edit-vehicle-start-time').value = vehicle['Start_Time'];
                document.getElementById('input-edit-vehicle-end-time').value = vehicle['End_Time']; 

                const vehicleRouteSelect = document.getElementById('input-edit-vehicle-route');
                vehicleRouteSelect.innerHTML = '';
                routes_data.forEach(route => {
                    const vehicleRouteOption = document.createElement('option');
                    vehicleRouteOption.value = route['id'];
                    vehicleRouteOption.textContent = route['Name'];
                    if (route['id'] === vehicle['Route_ID']) { 
                        vehicleRouteOption.selected = true;
                    }
                    vehicleRouteSelect.appendChild(vehicleRouteOption);
                })

                // /// add in extra Free option to choose not to assign vehicle
                // const vehicleRouteOption = document.createElement('option');
                // vehicleRouteOption.value = 'Free';
                // vehicleRouteOption.textContent = 'Free';
                // vehicleRouteSelect.appendChild(vehicleRouteOption);
                // ;

                $('#edit-vehicle-location-tonnage-modal').modal('show');
                
                $('#btn-confirm-edit-vehicle-location-tonnage').on('click', function() {
                    vehicle['Route_ID'] = document.getElementById('input-edit-vehicle-route').value; 
                    vehicle['Current_Lat'] = document.getElementById('input-edit-vehicle-location-lat').value; 
                    vehicle['Current_Long'] = document.getElementById('input-edit-vehicle-location-long').value; 
                    vehicle['Current_Tonnage'] = document.getElementById('input-edit-vehicle-tonnage').value; 
                    vehicle['Manpower'] = document.getElementById('input-edit-vehicle-manpower').value; 
                    vehicle['Start_Time'] = document.getElementById('input-edit-vehicle-start-time').value; 
                    vehicle['End_Time'] = document.getElementById('input-edit-vehicle-end-time').value; 
                    
                    $('#edit-vehicle-location-tonnage-modal').modal('hide');
                    updateRunOptimizationVehicleCardContent(card)
                });
            });

            const deleteButton = document.createElement('button');
            deleteButton.style.display = 'none';
            deleteButton.textContent = 'Remove';
            deleteButton.classList.add('btn', 'red-button', 'remove-vehicle-button'); 
            deleteButton.setAttribute('type', 'button'); 
            deleteButton.addEventListener('click', function(event) {
                event.stopPropagation();
                removeVehicleToOptimize(vehicle['id']);
            })

            vehEditDeleteButtons.appendChild(editButton);
            vehEditDeleteButtons.appendChild(deleteButton);
            card.appendChild(vehEditDeleteButtons);

            card.addEventListener('click', function(event) {
                // Check if the click originated from the edit button
                if (!event.target.closest('.edit-button') && !event.target.closest('.remove-vehicle-button')) {
                    addVehicleToOptimize(this.dataset.index);
                }
            });

            // Append card to container
            container.appendChild(card);
        });
        updateCardsCount(container, countElement, appendText);
    }

    function updateRunOptimizationVehicleCardContent(vehicleCard) {
        var vehicle = vehicles_data.find(vehicle => vehicle['id'] == vehicleCard.dataset.index);

        // Clear existing content
        const cardBody = vehicleCard.querySelector('.card-body');
        cardBody.innerHTML = '';

        // Populate card body with data
        var vehicleType = vehicle_types_data.find(vehicle_type => vehicle_type['id'] == vehicle['Vehicle_Type']);
        const vehTypetext = document.createElement('p');
        vehTypetext.textContent = `Vehicle Type: ${vehicleType['Name'] ? vehicleType['Name'] : ''}`;
        vehTypetext.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTypetext);

        var vehicleRoute = routes_data.find(route => route['id'] == vehicle['Route_ID']);
        const vehRouteText = document.createElement('p');
        vehRouteText.textContent = `Route: ${vehicleRoute['Name'] ? vehicleRoute['Name'] : ''}`;
        vehRouteText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehRouteText);

        const vehTripsText = document.createElement('p');
        vehTripsText.textContent = `Max Trips: ${vehicle['Max_Trips'] ? vehicle['Max_Trips'] : ''}`;
        vehTripsText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehTripsText);

        const vehManpowerText = document.createElement('p');
        vehManpowerText.textContent = `Manpower: ${vehicle['Manpower'] ? vehicle['Manpower'] : ''}`;
        vehManpowerText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehManpowerText);

        var depot = depots_data.find(depot => depot['id'] == vehicle['Depot']);
        const vehDepotText = document.createElement('p');
        vehDepotText.textContent = `Depot: ${depot['Name'] ? depot['Name'] : ''}`;
        vehDepotText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehDepotText);

        const vehBreakText = document.createElement('p');
        vehBreakText.textContent = `Break Time: ${vehicle['Break_Time'] ? vehicle['Break_Time'] : ''}`;
        vehBreakText.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehBreakText);

        const vehCurrentLat = document.createElement('p');
        vehCurrentLat.textContent = `Current Lat: ${vehicle['Current_Lat'] ? vehicle['Current_Lat'] : ''}`;
        vehCurrentLat.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehCurrentLat);

        const vehCurrentLong = document.createElement('p');
        vehCurrentLong.textContent = `Current Long: ${vehicle['Current_Long'] ? vehicle['Current_Long'] : ''}`;
        vehCurrentLong.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehCurrentLong);

        const vehCurrentTonnage = document.createElement('p');
        vehCurrentTonnage.textContent = `Current Tonnage: ${vehicle['Current_Tonnage'] ? vehicle['Current_Tonnage'] : ''}`;
        vehCurrentTonnage.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehCurrentTonnage);

        const vehStartTime = document.createElement('p');
        vehStartTime.textContent = `Current Start Time: ${vehicle['Start_Time'] ? vehicle['Start_Time'] : ''}`;
        vehStartTime.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehStartTime);

        const vehEndTime = document.createElement('p');
        vehEndTime.textContent = `Current End Time: ${vehicle['End_Time'] ? vehicle['End_Time'] : ''}`;
        vehEndTime.classList.add('cluster-card-row-item');
        cardBody.appendChild(vehEndTime);
    }

    function removeVehicleToOptimize(vehicleID) {
        if (vehiclesInvolvedSet.has(String(vehicleID))) {
            vehiclesInvolvedSet.delete(String(vehicleID));
            dragDropCard(vehicleID, document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles");
            document.getElementById('vehicle-cards-container').querySelector(`[data-index="${vehicleID}"]`).querySelector('.edit-delete-btn-container').querySelector('.remove-vehicle-button').style.display = 'none';    
            updateCardsCount(document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), " Vehicles Involved");
        }
    }

    function addVehicleToOptimize(vehicleID) {
        if (!vehiclesInvolvedSet.has(String(vehicleID))) {
            vehiclesInvolvedSet.add(String(vehicleID));
            dragDropCard(vehicleID, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), " Vehicles");          
            document.getElementById('vehicles-involved-cards-container').querySelector(`[data-index="${vehicleID}"]`).querySelector('.edit-delete-btn-container').querySelector('.remove-vehicle-button').style.display = 'block';    
            updateCardsCount(document.getElementById('vehicles-involved-cards-container'), document.getElementById('vehicles-involved-cards-count'), " Vehicles Involved");
        }
    }




    // Load Routes
    generateRouteCards(routes_data.filter(route => route['id'] >= 0), document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes", false, true);

    // Search Routes
    document.getElementById('input-search-route').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
    });

     // Select/Unselect all Routes
    document.getElementById('btn-select-all-routes').addEventListener('click', async function() {   
        const loadingAnimation = document.querySelector('.loading-screen');
        loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 0.6)';
        loadingAnimation.style.display = 'flex';

        document.getElementById('input-search-route').value = '';

        if (this.dataset.state === "select-all") {
            routes_data.forEach(route => {
                if (route['id'] >= 0) {
                    addRouteToOptimize(route['id']);
                }
            });

            clearMapLayer(runOptimizationRouteLayer);
            this.dataset.state = "unselect-all";
            this.textContent = "Unselect All";
        } else {
            routes_data.forEach(route => {
                if (route['id'] >= 0) {
                    removeRouteToOptimize(route['id']);
                }
            });

            this.dataset.state = "select-all";
            this.textContent = "Select All";
        }

        loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 1)';
        loadingAnimation.style.display = 'none';
    });
       
    // Select/Unselect individual Route
    document.getElementById('route-cards-container').querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            const routeID = this.dataset.index;

            if (this.dataset.alladded === "true") {
                removeRouteToOptimize(routeID);
            } else {
               addRouteToOptimize(routeID);
            }
        });
    });

    // Helper function to Add Route to routesToBreakSet
    function addRouteToOptimize(routeID) {
        routesToBreakSet.add(String(routeID));
        const routeCard = document.getElementById('route-cards-container').querySelector(`.card[data-index="${routeID}"]`);
        const ROUTE_NAME = routes_data.find(route => route['id'] == routeID)['Name'];
        Array.from(document.getElementById('points-cards-container').querySelectorAll('.card'))
        .filter(pointCard => pointCard.textContent.includes(ROUTE_NAME))
        .forEach(pointCard => {
            addPointToOptimize(pointCard);
        });
        focusRoute(routeID);
        routeCard.dataset.alladded = true;
        routeCard.style.display = 'none';
        hideROCPOverlay();
        updateCardsCount(document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
    }
    
    // Helper function to Remove Route from routesToBreakSet
    function removeRouteToOptimize(routeID) {
        if (routesToBreakSet.has(String(routeID))) {
            routesToBreakSet.delete(String(routeID));
            const routeCard = document.getElementById('route-cards-container').querySelector(`.card[data-index="${routeID}"]`);
            const ROUTE_NAME = routes_data.find(route => route['id'] == routeID)['Name'];
            document.getElementById(`${ROUTE_NAME}-points-involved-cards-container`).querySelectorAll('.card').forEach(pointCard => {
                removePointToOptimize(pointCard);
            });
            clearMapLayer(runOptimizationRouteLayer);
            routeCard.dataset.alladded = false;
            routeCard.style.display = 'block';
            hideROCPOverlay();
            updateCardsCount(document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
        }
    }




    // Load Points
    generateRunOptimizationCPCards(points_data, document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), " Points");

    // Search Points
    document.getElementById('input-search-points').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), " Points");
    });

    document.getElementById('input-search-points-involved-column-containers').addEventListener('input', function() {
        // Get the value of the input field
        const searchText = this.value.toUpperCase();
        console.log("searchText: ", searchText)
        // Loop through each child element
        Array.from(document.getElementById('points-involved-columns-container').querySelectorAll('.column-cards-small')).forEach(routePointsColumn => {
            console.log("route name: ", routePointsColumn.dataset.routename);
            // Check if the child element's ID contains the search text
            if (routePointsColumn.dataset.routename.toUpperCase().includes(searchText)) {
                routePointsColumn.style.display = 'block'; // Show the element
            } else {
                routePointsColumn.style.display = 'none'; // Hide the element
            }
        });
    });

    // Select/Unselect all Points
    document.getElementById('btn-select-all-points').addEventListener('click', async function() {
        const loadingAnimation = document.querySelector('.loading-screen');
        loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 0.6)';
        loadingAnimation.style.display = 'flex';

        document.getElementById('input-search-points').value = '';

        if (this.dataset.state === "select-all") {
            document.getElementById('points-cards-container').querySelectorAll('.card').forEach(pointCard => {
                addPointToOptimize(pointCard);
            });

            document.getElementById('route-cards-container').querySelectorAll('.card').forEach(routeCard => {
                routeCard.setAttribute('data-alladded', "true");
            });

            clearAllCards(document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), " Points");
            this.dataset.state = "unselect-all";
            this.textContent = "Unselect All";
        } else {
            clearMapLayer(runOptimizationMarkerLayer);
            pointsToAssignSet.clear();
            routesToBreakSet.clear();
            hideROCPOverlay();
            document.getElementById('route-cards-container').querySelectorAll('.card').forEach(routeCard => {
                routeCard.setAttribute('data-alladded', "false");
            });

            document.getElementById('points-involved-columns-container').innerHTML = `
            <div id="input-search-points-involved-column-containers-container" class="row">
                <div class="col">
                    <input type="text" class="input-search-cards" id="input-search-points-involved-column-containers" placeholder="Search...">
                </div>
                <div id="points-and-routes-involved-count" class="col-auto ml-auto cards-count">0 Routes, 0 Points</div>
            </div>`;

            clearAllCards(document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), " Points");
            generateRunOptimizationCPCards(points_data, document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), " Points");

            this.dataset.state = "select-all";
            this.textContent = "Select All";
        }

        loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 1)';
        loadingAnimation.style.display = 'none';
    });

    // CP Cards
    function generateRunOptimizationCPCards(points_data, container, countElement, appendText) {
        points_data.forEach(point => {
            // Create card element
            const card = document.createElement('div');
            card.classList.add('card');
            card.setAttribute('data-index', point['id']);
            
            // Create card title
            const cardTitle = document.createElement('div');
            cardTitle.classList.add('card-title');
            card.appendChild(cardTitle);

            // Populate card title with data
            const titleData = ['House', 'Street', 'Alias', 'Postal_Code'];
            titleData.forEach((property, index) => {
                const span = document.createElement('span');
                span.textContent = point[property] || '';
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
                    div.textContent = point[property] ? point[property] + " kg" : ''; 
                } else if (property == 'Network_Cluster') {
                    div.textContent = point[property] ? 'Cluster ' + point[property] : ''; 
                } else {
                    div.textContent = point[property] || '';
                }
                cardBody.appendChild(div);
            });

            var cpRoute = routes_data.find(route => route['id'] == point['Route_ID']);
            const cpRouteText = document.createElement('div');
            cpRouteText.textContent = `${cpRoute['Name'] ? cpRoute['Name'] : ''}`;
            cpRouteText.classList.add('cp-card-row-item');
            cardBody.appendChild(cpRouteText);

            const CPEditDeleteButtons = document.createElement('p');
            CPEditDeleteButtons.classList.add('edit-delete-btn-container'); 

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('btn', 'edit-button'); 
            editButton.setAttribute('type', 'button'); 
            editButton.addEventListener('click', function(event) {
                event.stopPropagation();
                const point = points_data.find(point => point['id'] == card.dataset.index);
                document.getElementById('input-edit-CP-tonnage').value = point['Tonnage_kg'];
                var pointVehTypeAllowed = String(point['Vehicle_Type_Allowed']).split(',');
                const vehicleTypeSelect = document.getElementById('input-edit-CP-vehType');
                vehicleTypeSelect.innerHTML = '';
                vehicle_types_data.forEach(vehicleType => {
                    const vehicleTypeOption = document.createElement('option');
                    vehicleTypeOption.value = vehicleType['id'];
                    vehicleTypeOption.textContent = vehicleType['Name'];

                    pointVehTypeAllowed.forEach(element => {
                        if (vehicleType['Name'] == element) { 
                            vehicleTypeOption.selected = true;
                        }
                    })

                    vehicleTypeSelect.appendChild(vehicleTypeOption);

                    vehicleTypeSelect.addEventListener('change', function() {
                        const selectedElements = Array.from(vehicleTypeSelect.options)
                            .filter(option => option.selected)
                            .map(option => option.textContent);
                        pointVehTypeAllowed = String(selectedElements.join(','));
                    });
                });

                $('#edit-CP-vehType-tonnage-modal').modal('show');
                $('#btn-confirm-edit-CP-vehType-tonnage').on('click', function() {
                    console.log("saving data");
                    point['Ideal_Vehicle_Type'] = document.getElementById('input-edit-CP-vehType').value; 
                    point['Tonnage_kg'] = document.getElementById('input-edit-CP-tonnage').value; 
                    point['Vehicle_Type_Allowed'] = pointVehTypeAllowed;
                    
                    $('#edit-CP-vehType-tonnage-modal').modal('hide');
                    updateRunOptimizationCPCardContent(card);
                });
            });

            const deleteButton = document.createElement('button');
            deleteButton.style.display = 'none';
            deleteButton.textContent = 'Remove';
            deleteButton.classList.add('btn', 'red-button', 'remove-cp-button'); 
            deleteButton.setAttribute('type', 'button'); 
            deleteButton.addEventListener('click', function(event) {
                event.stopPropagation();
                console.log("removing Point");
                removePointToOptimize(card);
            });
            
            CPEditDeleteButtons.appendChild(editButton);
            CPEditDeleteButtons.appendChild(deleteButton);
            card.appendChild(CPEditDeleteButtons);

            card.addEventListener('click', function(event) {
                if (!event.target.closest('.edit-button') && !event.target.closest('.remove-cp-button')) {
                    focusPoint(this.dataset.index);
                    addPointToOptimize(this);
                }
                event.stopPropagation();
            });

            // Append card to container
            container.appendChild(card);
        });
        updateCardsCount(container, countElement, appendText);
    }

    function updateRunOptimizationCPCardContent(CPCard) {
        var point = points_data.find(point => point['id'] == CPCard.dataset.index);

        // Update the title content
        const cardBody = CPCard.querySelector('.card-body');
        cardBody.innerHTML = ''; 

        // Populate card body with data
        const bodyData = ['Premises', 'Tonnage_kg', 'Vehicle_Type_Allowed', 'Network_Cluster'];
        bodyData.forEach(property => {
            const div = document.createElement('div');
            div.classList.add('cp-card-row-item');
            if (property == 'Tonnage_kg') {
                div.textContent = point[property] ? point[property] + " kg" : ''; 
            } else if (property == 'Network_Cluster') {
                div.textContent = point[property] ? 'Cluster ' + point[property] : ''; 
            } else {
                div.textContent = point[property] || '';
            }
            cardBody.appendChild(div);
        });

        var cpRoute = routes_data.find(route => route['id'] == point['Route_ID']);
        const cpRouteText = document.createElement('div');
        cpRouteText.textContent = `${cpRoute['Name'] ? cpRoute['Name'] : ''}`;
        cpRouteText.classList.add('cp-card-row-item');
        cardBody.appendChild(cpRouteText);
    }

    function generatePointsInvolvedColumn(Route_ID) {
        const ROUTE_NAME = routes_data.find(route => route['id'] == Route_ID)['Name'];
        // Create the main div
        const pointsInvolvedColumn = document.createElement('div');
        pointsInvolvedColumn.id = `${ROUTE_NAME}-points-involved-column`;
        pointsInvolvedColumn.classList.add('column-cards-small');
        pointsInvolvedColumn.setAttribute('data-routename', ROUTE_NAME);

        // Create the search input row
        const searchInputRow = document.createElement('div');
        searchInputRow.classList.add('row');
        searchInputRow.innerHTML = `
            <div class="col">
                <input type="text" class="input-search-cards" id="${ROUTE_NAME}-input-search-points-involved" placeholder="Search...">
            </div>
            <div class="col-auto ml-auto">
                <button class="map-button red-button remove-route-button" id="btn-remove-${ROUTE_NAME}">Remove Route</button>
            </div>
        `;
        pointsInvolvedColumn.appendChild(searchInputRow);

        // Create the count and top button row
        const countTopRow = document.createElement('div');
        countTopRow.classList.add('row');
        countTopRow.innerHTML = `
            <div class="col-9">
                <span id="${ROUTE_NAME}-points-involved-cards-count" class="cards-count">0 ${ROUTE_NAME} Points</span>
            </div>
        `;
        pointsInvolvedColumn.appendChild(countTopRow);

        // Create the cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.id = `${ROUTE_NAME}-points-involved-cards-container`;
        cardsContainer.classList.add('cards-container');
        pointsInvolvedColumn.appendChild(cardsContainer);

        // Append the main div to the parent element
        document.getElementById('points-involved-columns-container').appendChild(pointsInvolvedColumn);
        // pointsInvolvedColumn.addEventListener('click', function(event) {
        //     focusRoute(Route_ID);
        // });
        document.getElementById(`${ROUTE_NAME}-input-search-points-involved`).addEventListener('input', function() {
            searchCards(this.value, document.getElementById(`${ROUTE_NAME}-points-involved-cards-container`), document.getElementById(`${ROUTE_NAME}-points-involved-cards-count`), ` ${ROUTE_NAME} Points`);
        });
        document.getElementById(`btn-remove-${ROUTE_NAME}`).addEventListener('click', function() {
            removeRouteToOptimize(Route_ID);
        });
    }

    function addPointToOptimize(pointCard) {
        const POINT_ID = pointCard.dataset.index;
        if (!pointsToAssignSet.has(String(POINT_ID))) {
            const ROUTE_ID = points_data.find(point => point['id'] == POINT_ID)['Route_ID'];
            const ROUTE_NAME = routes_data.find(route => route['id'] == ROUTE_ID)['Name'];
            const ROUTE_POINTS_INVOLVED_COLUMN = document.getElementById(`${ROUTE_NAME}-points-involved-column`);
            if (!ROUTE_POINTS_INVOLVED_COLUMN) {
                generatePointsInvolvedColumn(ROUTE_ID);
            } 

            const ROUTE_POINTS_INVOLVED_CONTAINER = document.getElementById(`${ROUTE_NAME}-points-involved-cards-container`);
            const ROUTE_POINTS_INVOLVED_COUNT = document.getElementById(`${ROUTE_NAME}-points-involved-cards-count`);
            pointsToAssignSet.add(String(POINT_ID));
            routesToBreakSet.add(String(ROUTE_ID));
            plotRunOptimizationMarkersOnMap(POINT_ID, "circle", runOptimizationMarkerLayer);
            dragDropCard(POINT_ID, document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), ROUTE_POINTS_INVOLVED_CONTAINER, ROUTE_POINTS_INVOLVED_COUNT, " Points");   
            pointCard.querySelector('.edit-delete-btn-container').querySelector('.remove-cp-button').style.display = 'block';   
            pointCard.style.display = 'block';
            updateCardsCount(ROUTE_POINTS_INVOLVED_CONTAINER, ROUTE_POINTS_INVOLVED_COUNT, ` ${ROUTE_NAME} Points`);
            if (ROUTE_POINTS_INVOLVED_CONTAINER.childElementCount == routes_data.find(route => route['id'] == ROUTE_ID)['Points_Count']) {
                document.getElementById('route-cards-container').querySelector(`.card[data-index="${ROUTE_ID}"]`).dataset.alladded = true;
            }
            updatePointsAndRoutesCount();
        }
    }

    function removePointToOptimize(pointCard) {
        const POINT_ID = pointCard.dataset.index;
        if (pointsToAssignSet.has(String(POINT_ID))) {
            pointsToAssignSet.delete(String(POINT_ID));
            const ROUTE_ID = points_data.find(point => point['id'] == POINT_ID)['Route_ID'];
            const ROUTE_NAME = routes_data.find(route => route['id'] == ROUTE_ID)['Name'];
            const ROUTE_POINTS_INVOLVED_COLUMN = document.getElementById(`${ROUTE_NAME}-points-involved-column`);
            const ROUTE_POINTS_INVOLVED_CONTAINER = document.getElementById(`${ROUTE_NAME}-points-involved-cards-container`);
            const ROUTE_POINTS_INVOLVED_COUNT = document.getElementById(`${ROUTE_NAME}-points-involved-cards-count`);
            dragDropCard(POINT_ID, ROUTE_POINTS_INVOLVED_CONTAINER, ROUTE_POINTS_INVOLVED_COUNT, document.getElementById('points-cards-container'), document.getElementById('points-cards-count'), " Points");   
            pointCard.querySelector('.edit-delete-btn-container').querySelector('.remove-cp-button').style.display = 'none';    
            clearMapLayer(runOptimizationCurrentMarkerLayer);
            removeRunOptimizationMarker(POINT_ID);
            
            if (ROUTE_POINTS_INVOLVED_CONTAINER.children.length === 0) {
                ROUTE_POINTS_INVOLVED_COLUMN.remove();
                routesToBreakSet.delete(String(ROUTE_ID));
            }
            
            if (pointCard.textContent.toLowerCase().includes(document.getElementById('input-search-points').value)) {
                pointCard.style.display = 'block'; 
            } else {
                pointCard.style.display = 'none';
            }
            updateCardsCount(ROUTE_POINTS_INVOLVED_CONTAINER, ROUTE_POINTS_INVOLVED_COUNT, ` ${ROUTE_NAME} Points`);
            updatePointsAndRoutesCount();
            document.getElementById('route-cards-container').querySelector(`.card[data-index="${ROUTE_ID}"]`).dataset.alladded = false;
        } 
    }

    function updatePointsAndRoutesCount() {
        document.getElementById('points-and-routes-involved-count').textContent = `${routesToBreakSet.size} Routes, ${pointsToAssignSet.size} Points`;
    }


    // Optimize button
    document.getElementById('btn-optimize').addEventListener('click', function() {
        routesToBreakSet.clear();
        routesToOptimizeSet.clear();
        pointsToAssignSet.forEach(pointID => {
            routesToBreakSet.add(String(points_data.find(point => point['id'] == pointID)['Route_ID']));
        });

        vehiclesInvolvedSet.forEach(vehicleID => {
            const routeID = vehicles_data.find(vehicle => vehicle['id'] == vehicleID)['Route_ID'];
            routesToOptimizeSet.add(String(routeID));
            routesToBreakSet.delete(String(routeID));
        });

        // Create an object containing your sets and variables
        const data = {
            routesToBreak: routes_data.filter(route => routesToBreakSet.has(String(route['id']))),
            routesToOptimize: routes_data.filter(route => routesToOptimizeSet.has(String(route['id']))),
            pointsToAssign: points_data.filter(point => pointsToAssignSet.has(String(point['id']))),
            vehiclesInvolved: vehicles_data.filter(vehicle => vehiclesInvolvedSet.has(String(vehicle['id']))).map(vehicle => {
                return {
                    ...vehicle, 
                    vehicleCapacity: vehicle_types_data.find(vehType => vehType['id'] == vehicle['Vehicle_Type'])['Capacity'],
                    vehicleRange: vehicle_types_data.find(vehType => vehType['id'] == vehicle['Vehicle_Type'])['Range'],
                };
            }),
            depotData: depots_data,
            solverConfig: {
                mode: solverConfigMode,
                useClusters: isUseClusters,
            },
            allVehicleTypes: vehicle_types_data
        };
        
        if (solverConfigMode === "reshuffle") {
            data.pointsToAssign.forEach(point => {
                point['Route_ID'] = -1;
            });
        } 

        const loadingAnimation = document.querySelector('.loading-screen');
        loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 0.6)';
        loadingAnimation.style.display = 'flex';

        fetch('/solve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
            })
        .then(response => {
            if (!response.ok) {
                throw new Error('Check your assignments!');
            }
            return response.json();
        })
        .then(data => {
            window.location.href = '/edit_optimization?run_number=' + data.run_number;
        })
        .catch(error => {
            alert('An error occurred: ' + error.message);
            loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 1)';
            loadingAnimation.style.display = 'none';
        });
    })
});