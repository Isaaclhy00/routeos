let routesToBreakSet = new Set();
let routesToOptimizeSet = new Set();
let solverConfigMode = "Breakroute";
let isUseClusters = false;

const MIDDLE_COLUMN_TEXT = " Break";
const RIGHT_COLUMN_TEXT = " Optimize";

// Solver Config Mode Slider
function updateSolverConfigModeSliderPosition() {
    // Calculate the left position for the indicator
    const optionWidth = document.querySelector('.solver-config-mode-option').offsetWidth;
    const optionIndex = Array.from(document.querySelectorAll('.solver-config-mode-option')).findIndex(option => option.classList.contains('option-selected'));
    const leftPosition = optionIndex * optionWidth;

    // Move the indicator smoothly to the selected option
    document.getElementById('solver-config-mode-indicator').style.left = leftPosition + 'px';
}

$(document).ready(function () {
    updateSolverConfigModeSliderPosition();
    window.addEventListener('resize', updateSolverConfigModeSliderPosition);

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

            if (option.dataset.mode == "reshuffle") {
                document.getElementById('solver-config-bottom-row-reshuffle').style.display = 'flex';
                document.getElementById('solver-config-bottom-row-break').style.display = 'none';
            } else {
                document.getElementById('solver-config-bottom-row-reshuffle').style.display = 'none';
                document.getElementById('solver-config-bottom-row-break').style.display = 'flex';
            }

            routesToBreakSet.clear();
            routesToOptimizeSet.clear();

            document.getElementById('break-route-cards-container').querySelectorAll('.card').forEach(card => {
                card.style.display = 'block';
            });
            
            document.getElementById('routes-involved-cards-container').querySelectorAll('.card').forEach(card => {
                card.style.display = 'none';
            });
    
            document.getElementById('routes-not-involved-cards-container').querySelectorAll('.card').forEach(card => {
                card.style.display = 'none';
            });

            updateCardsCount(document.getElementById('break-route-cards-container'), document.getElementById('break-route-cards-count'), " Routes");
            updateCardsCount(document.getElementById('routes-involved-cards-container'), document.getElementById('routes-involved-cards-count'), ` Routes ${MIDDLE_COLUMN_TEXT}`);
            updateCardsCount(document.getElementById('routes-not-involved-cards-container'), document.getElementById('routes-not-involved-cards-count'), ` Routes ${RIGHT_COLUMN_TEXT}`);

            document.getElementById('reshuffle-route-cards-container').querySelectorAll('.card').forEach(card => {
                card.style.display = 'block';
            });
    
            document.getElementById('routes-to-reshuffle-cards-container').querySelectorAll('.card').forEach(card => {
                card.style.display = 'none';
            });
    
            updateCardsCount(document.getElementById('reshuffle-route-cards-container'), document.getElementById('reshuffle-route-cards-count'), " Routes");
            updateCardsCount(document.getElementById('routes-to-reshuffle-cards-container'), document.getElementById('routes-to-reshuffle-cards-count'), ` Routes To Reshuffle`);
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

    document.getElementById('reshuffle-btn-reset-routes').addEventListener('click', function() {
        routesToOptimizeSet.clear();

        document.getElementById('reshuffle-route-cards-container').querySelectorAll('.card').forEach(card => {
            card.style.display = 'block';
        });

        document.getElementById('routes-to-reshuffle-cards-container').querySelectorAll('.card').forEach(card => {
            card.style.display = 'none';
        });

        updateCardsCount(document.getElementById('reshuffle-route-cards-container'), document.getElementById('reshuffle-route-cards-count'), " Routes");
        updateCardsCount(document.getElementById('routes-to-reshuffle-cards-container'), document.getElementById('routes-to-reshuffle-cards-count'), ` Routes To Reshuffle`);
    })

    document.getElementById('break-btn-reset-routes').addEventListener('click', function() {
        routesToBreakSet.clear();
        routesToOptimizeSet.clear();

        document.getElementById('break-route-cards-container').querySelectorAll('.card').forEach(card => {
            card.style.display = 'block';
        });
        
        document.getElementById('routes-involved-cards-container').querySelectorAll('.card').forEach(card => {
            card.style.display = 'none';
        });

        document.getElementById('routes-not-involved-cards-container').querySelectorAll('.card').forEach(card => {
            card.style.display = 'none';
        });

        updateCardsCount(document.getElementById('break-route-cards-container'), document.getElementById('break-route-cards-count'), " Routes");
        updateCardsCount(document.getElementById('routes-involved-cards-container'), document.getElementById('routes-involved-cards-count'), ` Routes ${MIDDLE_COLUMN_TEXT}`);
        updateCardsCount(document.getElementById('routes-not-involved-cards-container'), document.getElementById('routes-not-involved-cards-count'), ` Routes ${RIGHT_COLUMN_TEXT}`);
    })

    // Load Routes
    generateRunOptimizationRouteCardsReshuffle(routes_data.filter(route => route['id'] >= 0), document.getElementById('reshuffle-route-cards-container'), document.getElementById('reshuffle-route-cards-count'), " Routes", "block");
    generateRunOptimizationRouteCardsReshuffle(routes_data.filter(route => route['id'] >= 0), document.getElementById('routes-to-reshuffle-cards-container'), document.getElementById('routes-to-reshuffle-cards-count'), " Routes To Reshuffle", "none");
    
    generateRunOptimizationRouteCardsBreak(routes_data.filter(route => route['id'] >= 0), document.getElementById('break-route-cards-container'), document.getElementById('break-route-cards-count'), " Routes", "block");
    generateRunOptimizationRouteCardsBreak(routes_data.filter(route => route['id'] >= 0), document.getElementById('routes-involved-cards-container'), document.getElementById('routes-involved-cards-count'), ` Routes To ${MIDDLE_COLUMN_TEXT}`, "none");
    generateRunOptimizationRouteCardsBreak(routes_data.filter(route => route['id'] >= 0), document.getElementById('routes-not-involved-cards-container'), document.getElementById('routes-not-involved-cards-count'), ` Routes To ${RIGHT_COLUMN_TEXT}`, "none");

    // Optimize button
    function handleOptimizeButtonClick() {
        // Remove previous event listener
        document.getElementById('btn-optimize').removeEventListener('click', handleOptimizeButtonClick);

        // Your optimization logic goes here
        console.log("routesToBreakSet:", routesToBreakSet)
        console.log("routesToOptimizeSet:", routesToOptimizeSet)
        // Create an object containing your sets and variables
        var data = {
            routesToBreak: routes_data.filter(route => routesToBreakSet.has(String(route['id']))),
            routesToOptimize: routes_data.filter(route => routesToOptimizeSet.has(String(route['id']))),
            pointsToAssign: points_data.filter(point => (routesToBreakSet.has(String(point['Route_ID'])) || routesToOptimizeSet.has(String(point['Route_ID'])))),
            vehiclesInvolved: vehicles_data.filter(vehicle => routesToOptimizeSet.has(String(vehicle['Route_ID']))),
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
        console.log(data);
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

        // Attach new event listener after the optimization logic is complete
        document.getElementById('btn-optimize').addEventListener('click', handleOptimizeButtonClick);
    }

    // Attach initial event listener
    document.getElementById('btn-optimize').addEventListener('click', handleOptimizeButtonClick);

});

// Route Cards
function generateRunOptimizationRouteCardsBreak(routes_data, container, countElement, appendText, display) {
    routes_data.forEach(route => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', route['id']);
        card.style.display = display;

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
        
        const routeSelectButtons = document.createElement('p');
        routeSelectButtons.classList.add('route-select-buttons-container'); 

        const toBreakButton = document.createElement('button');
        toBreakButton.style.display = container == document.getElementById('routes-involved-cards-container') ? 'none' : 'block';
        toBreakButton.textContent = MIDDLE_COLUMN_TEXT;
        toBreakButton.classList.add('btn', 'red-button', 'move-route-to-involved-button'); 
        toBreakButton.setAttribute('type', 'button'); 
        toBreakButton.addEventListener('click', function() {
            moveRouteBreak(card, document.getElementById('routes-involved-cards-container'));
        });

        const toOptimizeButton = document.createElement('button');
        toOptimizeButton.style.display = container == document.getElementById('routes-not-involved-cards-container') ? 'none' : 'block';
        toOptimizeButton.textContent = RIGHT_COLUMN_TEXT;
        toOptimizeButton.classList.add('btn', 'blue-button', 'move-route-to-not-involved-button'); 
        toOptimizeButton.setAttribute('type', 'button'); 
        toOptimizeButton.addEventListener('click', function() {
            moveRouteBreak(card, document.getElementById('routes-not-involved-cards-container'));
        });

        const backToAllRoutesButton = document.createElement('button');
        backToAllRoutesButton.style.display = container == document.getElementById('break-route-cards-container') ? 'none' : 'block';
        backToAllRoutesButton.textContent = 'Remove';
        backToAllRoutesButton.classList.add('btn', 'black-button', 'move-route-to-all-routes-button'); 
        backToAllRoutesButton.setAttribute('type', 'button'); 
        backToAllRoutesButton.addEventListener('click', function() {
            moveRouteBreak(card, document.getElementById('break-route-cards-container'));
        });
        
        routeSelectButtons.appendChild(toBreakButton);
        routeSelectButtons.appendChild(toOptimizeButton);
        routeSelectButtons.appendChild(backToAllRoutesButton);
        
        card.appendChild(routeSelectButtons);
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function generateRunOptimizationRouteCardsReshuffle(routes_data, container, countElement, appendText, display) {
    routes_data.forEach(route => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', route['id']);
        card.style.display = display;

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
        
        const routeSelectButtons = document.createElement('p');
        routeSelectButtons.classList.add('route-select-buttons-container'); 

        const toOptimizeButton = document.createElement('button');
        toOptimizeButton.style.display = container == document.getElementById('routes-to-reshuffle-cards-container') ? 'none' : 'block';
        toOptimizeButton.textContent = 'Reshuffle';
        toOptimizeButton.classList.add('btn', 'blue-button', 'move-route-to-involved-button'); 
        toOptimizeButton.setAttribute('type', 'button'); 
        toOptimizeButton.addEventListener('click', function() {
            moveRouteReshuffle(card, document.getElementById('routes-to-reshuffle-cards-container'));
        });

        const backToAllRoutesButton = document.createElement('button');
        backToAllRoutesButton.style.display = container == document.getElementById('reshuffle-route-cards-container') ? 'none' : 'block';
        backToAllRoutesButton.textContent = 'Remove';
        backToAllRoutesButton.classList.add('btn', 'black-button', 'move-route-to-all-routes-button'); 
        backToAllRoutesButton.setAttribute('type', 'button'); 
        backToAllRoutesButton.addEventListener('click', function() {
            moveRouteReshuffle(card, document.getElementById('reshuffle-route-cards-container'));
        });
        
        routeSelectButtons.appendChild(toOptimizeButton);
        routeSelectButtons.appendChild(backToAllRoutesButton);
        
        card.appendChild(routeSelectButtons);
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function moveRouteBreak(routeCard, destinationContainer) {
    routeCard.style.display = 'none';
    const ROUTE_ID = String(routeCard.dataset.index);
    destinationContainer.querySelector(`[data-index="${ROUTE_ID}"]`).style.display = 'block';
    scrollToCardByIndex(ROUTE_ID, destinationContainer);

    if (destinationContainer == document.getElementById('routes-involved-cards-container')) {
        routesToBreakSet.add(ROUTE_ID);
        routesToOptimizeSet.delete(ROUTE_ID);
    } else if (destinationContainer == document.getElementById('routes-not-involved-cards-container')) {
        routesToBreakSet.delete(ROUTE_ID);
        routesToOptimizeSet.add(ROUTE_ID);
    } else {
        routesToBreakSet.delete(ROUTE_ID);
        routesToOptimizeSet.delete(ROUTE_ID);
    }
    
    updateCardsCount(document.getElementById('break-route-cards-container'), document.getElementById('break-route-cards-count'), " Routes");
    updateCardsCount(document.getElementById('routes-involved-cards-container'), document.getElementById('routes-involved-cards-count'), ` Routes To ${MIDDLE_COLUMN_TEXT}`);
    updateCardsCount(document.getElementById('routes-not-involved-cards-container'), document.getElementById('routes-not-involved-cards-count'), ` Routes To ${RIGHT_COLUMN_TEXT}`);
}

function moveRouteReshuffle(routeCard, destinationContainer) {
    routeCard.style.display = 'none';
    const ROUTE_ID = String(routeCard.dataset.index);
    destinationContainer.querySelector(`[data-index="${ROUTE_ID}"]`).style.display = 'block';
    scrollToCardByIndex(ROUTE_ID, destinationContainer);

    if (destinationContainer == document.getElementById('routes-to-reshuffle-cards-container')) {
        routesToOptimizeSet.add(ROUTE_ID);
    } else {
        routesToOptimizeSet.delete(ROUTE_ID);
    }
    
    updateCardsCount(document.getElementById('reshuffle-route-cards-container'), document.getElementById('reshuffle-route-cards-count'), " Routes");
    updateCardsCount(document.getElementById('routes-to-reshuffle-cards-container'), document.getElementById('routes-to-reshuffle-cards-count'), " Routes To Reshuffle");
}


