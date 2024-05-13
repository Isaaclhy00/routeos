let Current_Vehicle_Type_ID;
let Current_Vehicle_ID;
let Current_Route_ID;
let Current_Depot_ID;

$(document).ready(function () {
    // Upload Fleet 
    const uploadButton = document.getElementById('btn-upload-fleet');
    const fileInput = document.getElementById('input-upload-fleet');

    // Add an event listener to the button
    uploadButton.addEventListener('click', function() {
        // Trigger click event on the file input field
        fileInput.click();
    });

    // Event listener for file input change
    fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        uploadButton.textContent = file.name;
        var reader = new FileReader();
    
        reader.onload = function (e) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
    
            // Loop through each sheet in the Excel file
            workbook.SheetNames.forEach(function(sheetName) {
                var sheet = workbook.Sheets[sheetName];
                var jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });
    
                // Process jsonData based on the sheet name
                switch (sheetName) {
                    case "Depots":
                        jsonData.forEach((row, index) => {
                            row['id'] = index;
                            const columnsToAdd = ["Name", "lat", "long"]
                            columnsToAdd.forEach(columnName => {
                                if (!(columnName in row)) {
                                    row[columnName] = null;
                                } else {
                                    // Ensure that lat and long values are numbers
                                    if (["lat", "long"].includes(columnName)) {
                                        const value = parseFloat(row[columnName]);
                                        if (!isNaN(value)) {
                                            row[columnName] = value;
                                        } else {
                                            row[columnName] = null; 
                                        }
                                    }
                                }
                            });
                        });
                        depots_data = [ ...jsonData ];
                        updateDepotsData();
                        clearAllCards(document.getElementById('depot-cards-container'), document.getElementById('depot-cards-count'), " Depots");
                        generateDepotCards(depots_data, document.getElementById('depot-cards-container'), document.getElementById('depot-cards-count'), " Depots");
                        break;
                    case "Vehicle Types":
                        jsonData.forEach((row, index) => {
                            row['id'] = index;
                            const columnsToAdd = ["Name", "Capacity", "Range"]
                            columnsToAdd.forEach(columnName => {
                                if (!(columnName in row)) {
                                    row[columnName] = null;
                                } else {
                                    // Ensure that Capacity and Range values are numbers
                                    if (["Capacity", "Range"].includes(columnName)) {
                                        const value = parseFloat(row[columnName]);
                                        if (!isNaN(value)) {
                                            row[columnName] = value;
                                        } else {
                                            row[columnName] = null; 
                                        }
                                    }
                                }
                            });
                        });
                        vehicle_types_data = [ ...jsonData ];
                        updateVehicleTypesData();
                        clearAllCards(document.getElementById('veh-type-cards-container'), document.getElementById('veh-type-cards-count'), " Vehicle Types");
                        generateVehicleTypeCards(vehicle_types_data, document.getElementById('veh-type-cards-container'), document.getElementById('veh-type-cards-count'), " Vehicle Types");
                        break;
                    case "Routes":
                        jsonData.forEach((row, index) => {
                            row['id'] = index;
                            const columnsToAdd = ["Name", "Depot", "Vehicle_Type", "Max_Trips", "Manpower", "Points_Count"]
                            columnsToAdd.forEach(columnName => {
                                if (!(columnName in row)) {
                                    row[columnName] = null;
                                    row["Points_Count"] = 0
                                } else {
                                    // Ensure that Capacity, Range, and other values are numbers
                                    switch (columnName) {
                                        case "Max_Trips":
                                        case "Manpower":
                                        case "Points_Count":
                                            const value = parseFloat(row[columnName]);
                                            row[columnName] = !isNaN(value) ? value : null;
                                            break;
                                
                                        case "Depot":
                                            const depotName = row[columnName];
                                            row['Depot'] = depots_data.find(depot => depot['Name'] == depotName)['id'];
                                            break;
                                
                                        case "Vehicle_Type":
                                            const vehicleType = row[columnName];
                                            row['Vehicle_Type'] = vehicle_types_data.find(vehicle_type => vehicle_type['Name'] == vehicleType)['id'];
                                            break;

                                        default:
                                            break;
                                    }
                                }
                            });
                        });
                        routes_data = [ ...jsonData ];
                        updateRoutesData();
                        clearAllCards(document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
                        generateRouteCards(routes_data.filter(route => route['id'] >= 0), document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
                        break;
                    case "Vehicles":
                        jsonData.forEach((row, index) => {
                            row['id'] = index;
                            const columnsToAdd = ["Name", "Vehicle_Type", "Route_ID", "Max_Trips", "Manpower", "Depot", "Break_Time", "Current_Lat",
                             "Current_Long", "Current_Tonnage", "Start_Time", "End_Time"]
                            columnsToAdd.forEach(columnName => {
                                if (!(columnName in row)) {
                                    row[columnName] = null;
                                } else {
                                    // Ensure that Capacity, Range, and other values are numbers
                                    switch (columnName) {
                                        case "Max_Trips":
                                        case "Manpower":
                                        case "Break_Time":
                                        case "Current_Lat":
                                        case "Current_Long":
                                        case "Current_Tonnage":
                                            const value = parseFloat(row[columnName]);
                                            row[columnName] = !isNaN(value) ? value : null;
                                            break;

                                        case "Vehicle_Type":
                                            const vehicleType = row[columnName];
                                            row['Vehicle_Type'] = vehicle_types_data.find(vehicle_type => vehicle_type['Name'] == vehicleType)['id'];
                                            break;

                                        case "Route_ID":
                                            const routeName = row[columnName];
                                            row['Route_ID'] = routes_data.find(route => route['Name'] == routeName)['id'];
                                            break;
                                
                                        case "Depot":
                                            const depotName = row[columnName];
                                            row['Depot'] = depots_data.find(depot => depot['Name'] == depotName)['id'];
                                            break;
                                
                                        default:
                                            break;
                                    }
                                }
                            });
                        });
                        vehicles_data = [ ...jsonData ];
                        updateVehiclesData();
                        clearAllCards(document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles", true, false);
                        generateVehicleCards(vehicles_data, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles", true, false);
                        break;
                    default:
                        break;
                }
                console.log(jsonData);
            });
        };
        reader.readAsArrayBuffer(file);
    });

    // Download Excel Button
    document.getElementById("btn-downlaod-fleet").addEventListener("click", function(){
        $('#download-fleet-excel-modal').modal('show');

        // Event listener for the confirm download button in the modal
        document.getElementById('btn-confirm-download-fleet-excel').addEventListener('click', function() {
            var filename = document.getElementById("input-fleet-excel-filename").value;

            // Append ".xlsx" to the filename if it's not already present
            if (!filename.endsWith('.xlsx')) {
                filename += '.xlsx';
            }

            const mapped_routes_data = routes_data.filter(route => route.id !== -1).map(route => {
                // Update Depot and Vehicle_Type
                route['Depot'] = depots_data.find(depot => depot['id'] == route['Depot'])['Name'];
                route['Vehicle_Type'] = vehicle_types_data.find(vehType => vehType['id'] == route['Vehicle_Type'])['Name'];
                return route;
            }).map(route => {
                delete route['Points_Count'];
                return route;
            });

            const mapped_vehicles_data = vehicles_data.map(vehicle => {
                // Update Depot and Vehicle_Type
                vehicle['Depot'] = depots_data.find(depot => depot['id'] == vehicle['Depot'])['Name'];
                vehicle['Vehicle_Type'] = vehicle_types_data.find(vehType => vehType['id'] == vehicle['Vehicle_Type'])['Name'];
                vehicle['Route_ID'] = routes_data.find(route => route['id'] == vehicle['Route_ID'])['Name'];
                return vehicle;
            });
            

            const wb = XLSX.utils.book_new();
            wb.SheetNames.push('Depots');
            wb.SheetNames.push('Vehicle Types');
            wb.SheetNames.push('Routes');
            wb.SheetNames.push('Vehicles');
            
            // console.log("depots_data", depots_data);
            // console.log("vehicle_types_data", vehicle_types_data);
            // console.log("mapped_routes_data", mapped_routes_data);
            // console.log("mapped_vehicles_data", mapped_vehicles_data);

            function getDataArray(data) {
                // Filter out the 'id' attribute from the headers
                const headers = Object.keys(data[0]).filter(key => key !== 'id');
            
                // Map objects to values while excluding the 'id' attribute
                const dataArray = [headers, ...data.map(obj => {
                    return headers.map(header => obj[header]);
                })];
            
                return dataArray;
            }

            const depotsArray = getDataArray(depots_data);
            const vehicleTypesArray = getDataArray(vehicle_types_data);
            const routesArray = getDataArray(mapped_routes_data);
            const vehiclesArray = getDataArray(mapped_vehicles_data);

            wb.Sheets['Depots'] = XLSX.utils.aoa_to_sheet(depotsArray);
            wb.Sheets['Vehicle Types'] = XLSX.utils.aoa_to_sheet(vehicleTypesArray);
            wb.Sheets['Routes'] = XLSX.utils.aoa_to_sheet(routesArray);
            wb.Sheets['Vehicles'] = XLSX.utils.aoa_to_sheet(vehiclesArray);

            XLSX.writeFile(wb, filename);

            document.getElementById("input-fleet-excel-filename").value = "";
            $('#download-fleet-excel-modal').modal('hide');
            console.log("Downloaded", filename);
        });

        // Event listener for the cancel download button in the modal
        document.getElementById('btn-cancel-download-fleet-excel').addEventListener('click', function() {
            document.getElementById("input-fleet-excel-filename").value = "";
        });
    });

    
    // Load Depots
    generateDepotCards(depots_data, document.getElementById('depot-cards-container'), document.getElementById('depot-cards-count'), " Depots");

    // Search Depots
    document.getElementById('input-search-depot').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('depot-cards-container'), document.getElementById('depot-cards-count'), " Depots");
    });

    // First Depot
    document.getElementById('btn-top-depot').addEventListener('click', function() {
        scrollToTop(document.getElementById('depot-cards-container'));
    });

    // Delete Depot
    document.getElementById('btn-delete-depot').addEventListener('click', () => {
        var isRouteUsingThisDepot = routes_data.some(route => route['Depot'] === Current_Depot_ID && route['id'] !== -1);
        var isVehicleUsingThisDepot = vehicles_data.some(vehicle => vehicle['Depot'] === Current_Depot_ID);

        if (isRouteUsingThisDepot || isVehicleUsingThisDepot) {
            alert(routes_data.filter(route => route['Depot'] === Current_Depot_ID && route['id'] !== -1).map(route => route['Name']).join(', ') 
            + ', '
            + vehicles_data.filter(vehicle => vehicle['Depot'] === Current_Depot_ID).map(vehicle => vehicle['Name']).join(', ') 
            + ' is still tagged to this depot!');
        } else {
            depots_data = depots_data.filter(depot => depot['id'] !== Current_Depot_ID);
            updateDepotsData();
            deleteCard(Current_Depot_ID, document.getElementById('depot-cards-container'), document.getElementById('depot-cards-count'), " Depots");
            $('#depot-modal').modal('hide');
        }

    });

    // Save Depot
    document.getElementById('btn-save-depot').addEventListener('click', () => {
        if (Current_Depot_ID !== null) {
            var depot = depots_data.find(depot => depot['id'] == Current_Depot_ID);
            depot['Name'] = document.getElementById('input-depot-name').value;
            depot['lat'] = document.getElementById('input-depot-lat').value;
            depot['long'] = document.getElementById('input-depot-long').value;
            updateDepotsData();
            updateDepotCardContent(Current_Depot_ID, depot, document.getElementById('depot-cards-container'));

            routes_data.forEach(route => {
                updateRouteCardContent(route['id'], route, document.getElementById('route-cards-container'));
            });

            vehicles_data.forEach(vehicle => {
                updateVehicleCardContent(vehicle['id'], vehicle, document.getElementById('vehicle-cards-container'));
            });
        } else {
            Current_Depot_ID = getMaxId(depots_data, 'id') + 1;
            var newDepot = {
                'id' : Current_Depot_ID,
                'Name' : document.getElementById('input-depot-name').value,
                'lat' : document.getElementById('input-depot-lat').value,
                'long' : document.getElementById('input-depot-long').value,
            }
            depots_data.push(newDepot);
            updateDepotsData();
            generateDepotCards([newDepot], document.getElementById('depot-cards-container'), document.getElementById('depot-cards-count'), " Depots");
            scrollToCardByIndex(Current_Depot_ID, document.getElementById('depot-cards-container'));
        }
        $('#depot-modal').modal('hide');
    });

    // Create Depot
    document.getElementById('btn-create-depot').addEventListener('click', function() {
        Current_Depot_ID = null;
        document.getElementById('input-depot-name').value = '';
        document.getElementById('input-depot-lat').value = '';
        document.getElementById('input-depot-long').value = '';
        $('#depot-modal').modal('show');
    });



    // Load Vehicle Types
    generateVehicleTypeCards(vehicle_types_data, document.getElementById('veh-type-cards-container'), document.getElementById('veh-type-cards-count'), " Vehicle Types");
    
    // Search Vehicle Types
    document.getElementById('input-search-veh-type').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('veh-type-cards-container'), document.getElementById('veh-type-cards-count'), " Vehicle Types");
    });

    // First Vehicle Type
    document.getElementById('btn-top-veh-type').addEventListener('click', function() {
        scrollToTop(document.getElementById('veh-type-cards-container'));
    });

    // Delete Vehicle Type
    document.getElementById('btn-delete-veh-type').addEventListener('click', () => {
        var isRouteUsingThisVType = routes_data.some(route => route['Vehicle_Type'] === Current_Vehicle_Type_ID && route['id'] !== -1);
        var isVehicleUsingThisVType = vehicles_data.some(vehicle => vehicle['Vehicle_Type'] === Current_Vehicle_Type_ID);

        if (isRouteUsingThisVType || isVehicleUsingThisVType) {
            alert(routes_data.filter(route => route['Vehicle_Type'] === Current_Vehicle_Type_ID && route['id'] !== -1).map(route => route['Name']).join(', ') 
            + ', '
            + vehicles_data.filter(vehicle => vehicle['Vehicle_Type'] === Current_Vehicle_Type_ID).map(vehicle => vehicle['Name']).join(', ') 
            + ' is still tagged to this vehicle type!');
        } else {
            vehicle_types_data = vehicle_types_data.filter(vehicle_type => vehicle_type['id'] !== Current_Vehicle_Type_ID);
            updateVehicleTypesData();
            $('#veh-type-modal').modal('hide');
            deleteCard(Current_Vehicle_Type_ID, document.getElementById('veh-type-cards-container'), document.getElementById('veh-type-cards-count'), " Vehicle Types");
        }
    });

    // Save Vehicle Type
    document.getElementById('btn-save-veh-type').addEventListener('click', () => {
        if (Current_Vehicle_Type_ID !== null) {
            var vehicle_type = vehicle_types_data.find(vehicle_type => vehicle_type['id'] == Current_Vehicle_Type_ID);
            vehicle_type['Name'] = document.getElementById('input-veh-type-name').value;
            vehicle_type['Capacity'] = document.getElementById('input-veh-type-capacity').value;
            vehicle_type['Range'] = document.getElementById('input-veh-type-range').value;
            updateVehicleTypesData();
            updateVehicleTypeCardContent(Current_Vehicle_Type_ID, vehicle_type, document.getElementById('veh-type-cards-container'));

            vehicles_data.forEach(vehicle => {
                updateVehicleCardContent(vehicle['id'], vehicle, document.getElementById('vehicle-cards-container'));
            });
        } else {
            Current_Vehicle_Type_ID = getMaxId(vehicle_types_data, 'id') + 1;
            var newVehType = {
                'id' : Current_Vehicle_Type_ID,
                'Name' : document.getElementById('input-veh-type-name').value,
                'Capacity' : document.getElementById('input-veh-type-capacity').value,
                'Range' : document.getElementById('input-veh-type-range').value
            }
            vehicle_types_data.push(newVehType);
            updateVehicleTypesData();
            generateVehicleTypeCards([newVehType], document.getElementById('veh-type-cards-container'), document.getElementById('veh-type-cards-count'), " Vehicle Types");
            scrollToCardByIndex(Current_Vehicle_Type_ID, document.getElementById('veh-type-cards-container'));
        }
        $('#veh-type-modal').modal('hide');
    });

    // Create Vehicle Type
    document.getElementById('btn-create-veh-type').addEventListener('click', function() {
        Current_Vehicle_Type_ID = null;
        document.getElementById('input-veh-type-name').value = '';
        document.getElementById('input-veh-type-capacity').value = '';
        document.getElementById('input-veh-type-range').value = '';
        $('#veh-type-modal').modal('show');
    });




    // Load Routes
    generateRouteCards(routes_data.filter(route => route['id'] >= 0), document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");

    // Search Routes
    document.getElementById('input-search-route').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
    });

    // First Route
    document.getElementById('btn-top-route').addEventListener('click', function() {
        scrollToTop(document.getElementById('route-cards-container'));
    });

    // Delete Route
    document.getElementById('btn-delete-route').addEventListener('click', () => {
        var isVehicleUsingThisRoute = vehicles_data.some(vehicle => vehicle['Route_ID'] === Current_Route_ID);

        if (isVehicleUsingThisRoute) {
            alert(vehicles_data.filter(vehicle => vehicle['Route_ID'] === Current_Route_ID).map(vehicle => vehicle['Name']).join(', ') 
            + ' is still tagged to this route!');
        } else {
            routes_data = routes_data.filter(route => route['id'] !== Current_Route_ID);
            updateRoutesData();
            deleteCard(Current_Route_ID, document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
            $('#route-modal').modal('hide');
        }
    });

    // Save Route
    document.getElementById('btn-save-route').addEventListener('click', () => {
        if (Current_Route_ID !== null) {
            var route = routes_data.find(route => route['id'] == Current_Route_ID);
            route['Name'] = document.getElementById('input-route-name').value;
            route['Depot'] = document.getElementById('input-route-depot').value;
            route['Vehicle_Type'] = document.getElementById('input-route-vehicle-type').value;
            route['Max_Trips'] = document.getElementById('input-route-trips').value;
            route['Manpower'] = document.getElementById('input-route-manpower').value;
            updateRoutesData();
            updateRouteCardContent(Current_Route_ID, route, document.getElementById('route-cards-container'));

            vehicles_data.forEach(vehicle => {
                updateVehicleCardContent(vehicle['id'], vehicle, document.getElementById('vehicle-cards-container'));
            });
        } else {
            Current_Route_ID = getMaxId(routes_data, 'id') + 1;
            var newRoute = {
                'id' : Current_Route_ID,
                'Name' : document.getElementById('input-route-name').value,
                'Depot' : document.getElementById('input-route-depot').value,
                'Vehicle_Type' : document.getElementById('input-route-vehicle-type').value,
                'Max_Trips' : document.getElementById('input-route-trips').value,
                'Manpower' : document.getElementById('input-route-manpower').value
            }
            routes_data.push(newRoute);
            updateRoutesData();
            generateRouteCards([newRoute], document.getElementById('route-cards-container'), document.getElementById('route-cards-count'), " Routes");
            scrollToCardByIndex(Current_Route_ID, document.getElementById('route-cards-container'));
        }
        $('#route-modal').modal('hide');
    });

    // Create Route
    document.getElementById('btn-create-route').addEventListener('click', function() {
        Current_Route_ID = null;
        document.getElementById('input-route-name').value = 'New Route';
        document.getElementById('input-route-depot').value = '';
        document.getElementById('input-route-trips').value = 0;
        document.getElementById('input-route-manpower').value = 0;
        showRouteModal();
    });




    // Load Vehicles
    generateVehicleCards(vehicles_data, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles", true, false);

    // Search Vehicles
    document.getElementById('input-search-vehicle').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles");
    });

    // First Vehicle
    document.getElementById('btn-top-vehicle').addEventListener('click', function() {
        scrollToTop(document.getElementById('vehicle-cards-container'));
    });

    // Delete Vehicle
    document.getElementById('btn-delete-vehicle').addEventListener('click', () => {
        vehicles_data = vehicles_data.filter(vehicle => vehicle['id'] !== Current_Vehicle_ID);
        updateVehiclesData();
        deleteCard(Current_Vehicle_ID, document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles");
        $('#vehicle-modal').modal('hide');
    });

    // Save Vehicle
    document.getElementById('btn-save-vehicle').addEventListener('click', () => {
        if (Current_Vehicle_ID !== null) {
            var vehicle = vehicles_data.find(vehicle => vehicle['id'] == Current_Vehicle_ID);
            vehicle['Name'] = document.getElementById('input-vehicle-name').value;
            vehicle['Vehicle_Type'] = document.getElementById('input-vehicle-type').value;
            vehicle['Route_ID'] = document.getElementById('input-vehicle-route').value;
            // vehicle['Max_Trips'] = document.getElementById('input-vehicle-trips').value;
            // vehicle['Manpower'] = document.getElementById('input-vehicle-manpower').value;
            vehicle['Depot'] = document.getElementById('input-vehicle-depot').value;
            updateVehiclesData();
            updateVehicleCardContent(Current_Vehicle_ID, vehicle, document.getElementById('vehicle-cards-container'));
        } else {
            Current_Vehicle_ID = getMaxId(vehicles_data, 'id') + 1;
            var newVehicle = {
                'id' : Current_Vehicle_ID,
                'Name' : document.getElementById('input-vehicle-name').value,
                'Vehicle_Type' : document.getElementById('input-vehicle-type').value,
                'Route_ID' : document.getElementById('input-vehicle-route').value,
                // 'Max_Trips' : document.getElementById('input-vehicle-trips').value,
                // 'Manpower' : document.getElementById('input-vehicle-manpower').value,
                'Depot' : document.getElementById('input-vehicle-depot').value,
            }
            vehicles_data.push(newVehicle);
            updateVehiclesData();
            generateVehicleCards([newVehicle], document.getElementById('vehicle-cards-container'), document.getElementById('vehicle-cards-count'), " Vehicles", true, false);
            scrollToCardByIndex(Current_Vehicle_ID, document.getElementById('vehicle-cards-container'));
        }
        $('#vehicle-modal').modal('hide');
    });

    // Create Vehicle
    document.getElementById('btn-create-vehicle').addEventListener('click', function() {
        Current_Vehicle_ID = null;
        document.getElementById('input-vehicle-name').value = '';
        document.getElementById('input-vehicle-type').value = '';
        document.getElementById('input-vehicle-route').value = '';
        // document.getElementById('input-vehicle-trips').value = '';
        // document.getElementById('input-vehicle-manpower').value = '';
        showVehicleModal();
    });
});

function showVehicleModal() {
    if (Current_Vehicle_ID !== null) {
        var vehicle = vehicles_data.find(vehicle => vehicle['id'] == Current_Vehicle_ID);
        const vehicleTypeSelect = document.getElementById('input-vehicle-type');
        vehicleTypeSelect.innerHTML = '';
        vehicle_types_data.forEach(vehicleType => {
            const vehicleTypeOption = document.createElement('option');
            vehicleTypeOption.value = vehicleType['id'];
            vehicleTypeOption.textContent = vehicleType['Name'];
            if (vehicleType['id'] === vehicle['Vehicle_Type']) { 
                vehicleTypeOption.selected = true;
            }
            vehicleTypeSelect.appendChild(vehicleTypeOption);
        });

        const vehicleRouteSelect = document.getElementById('input-vehicle-route');
        vehicleRouteSelect.innerHTML = '';
        routes_data.forEach(route => {
            const vehicleRouteOption = document.createElement('option');
            vehicleRouteOption.value = route['id'];
            vehicleRouteOption.textContent = route['Name'];
            if (route['id'] === vehicle['Route_ID']) { 
                vehicleRouteOption.selected = true;
            }
            vehicleRouteSelect.appendChild(vehicleRouteOption);
        });

        const vehicleDepotSelect = document.getElementById('input-vehicle-depot');
        vehicleDepotSelect.innerHTML = '';
        depots_data.forEach(depot => {
            const vehicleDepotOption = document.createElement('option');
            vehicleDepotOption.value = depot['id'];
            vehicleDepotOption.textContent = depot['Name'];
            if (depot['id'] === vehicle['Depot']) { 
                vehicleDepotOption.selected = true;
            }
            vehicleDepotSelect.appendChild(vehicleDepotOption);
        });
    } else {
        const vehicleTypeSelect = document.getElementById('input-vehicle-type');
        vehicleTypeSelect.innerHTML = '';
        vehicle_types_data.forEach(vehicleType => {
            const vehicleTypeOption = document.createElement('option');
            vehicleTypeOption.value = vehicleType['id'];
            vehicleTypeOption.textContent = vehicleType['Name'];
            vehicleTypeSelect.appendChild(vehicleTypeOption);
        });

        const vehicleRouteSelect = document.getElementById('input-vehicle-route');
        vehicleRouteSelect.innerHTML = '';
        routes_data.forEach(route => {
            const vehicleRouteOption = document.createElement('option');
            vehicleRouteOption.value = route['id'];
            vehicleRouteOption.textContent = route['Name'];
            vehicleRouteSelect.appendChild(vehicleRouteOption);
        });

        const vehicleDepotSelect = document.getElementById('input-vehicle-depot');
        vehicleDepotSelect.innerHTML = '';
        depots_data.forEach(depot => {
            const vehicleDepotOption = document.createElement('option');
            vehicleDepotOption.value = depot['id'];
            vehicleDepotOption.textContent = depot['Name'];
            vehicleDepotSelect.appendChild(vehicleDepotOption);
        });
    }
    $('#vehicle-modal').modal('show');
}

function showRouteModal() {
    if (Current_Route_ID !== null) {
        var route = routes_data.find(route => route['id'] == Current_Route_ID);
        const routeDepotSelect = document.getElementById('input-route-depot');
        routeDepotSelect.innerHTML = '';
        depots_data.forEach(depot => {
            const routeDepotOption = document.createElement('option');
            routeDepotOption.value = depot['id'];
            routeDepotOption.textContent = depot['Name'];
            if (depot['Name'] === route['Depot']) { 
                routeDepotOption.selected = true;
            }
            routeDepotSelect.appendChild(routeDepotOption);
        });

        const vehicleTypeSelect = document.getElementById('input-route-vehicle-type');
        vehicleTypeSelect.innerHTML = '';
        vehicle_types_data.forEach(vehicleType => {
            const vehicleTypeOption = document.createElement('option');
            vehicleTypeOption.value = vehicleType['id'];
            vehicleTypeOption.textContent = vehicleType['Name'];
            if (vehicleType['id'] === route['Vehicle_Type']) { 
                vehicleTypeOption.selected = true;
            }
            vehicleTypeSelect.appendChild(vehicleTypeOption);
        });
        document.getElementById('input-route-trips').value = route['Max_Trips'];
        document.getElementById('input-route-manpower').value = route['Manpower'];
    } else {
        const routeDepotSelect = document.getElementById('input-route-depot');
        routeDepotSelect.innerHTML = '';
        depots_data.forEach(depot => {
            const routeDepotOption = document.createElement('option');
            routeDepotOption.value = depot['id'];
            routeDepotOption.textContent = depot['Name'];
            routeDepotSelect.appendChild(routeDepotOption);
        });

        const vehicleTypeSelect = document.getElementById('input-route-vehicle-type');
        vehicleTypeSelect.innerHTML = '';
        vehicle_types_data.forEach(vehicleType => {
            const vehicleTypeOption = document.createElement('option');
            vehicleTypeOption.value = vehicleType['id'];
            vehicleTypeOption.textContent = vehicleType['Name'];
            vehicleTypeSelect.appendChild(vehicleTypeOption);
        });
    }
    $('#route-modal').modal('show');
}