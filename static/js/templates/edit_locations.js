// init data holder
// var cpHeader = [];
var cpHeader = ['House', 'Street', 'Postal_Code', 'Premises', 'Direct Collection', 'Allowed_Veh', 'Ideal_Vehicle_Type', 'Service_Time_min', 'Vehicle_Type_Allowed', 'Min_Collection_Time_hrs', 'Max_Collection_Time_hrs', 'Time_Collected_hrs', 'Tonnage_kg', 'Manpower', 'Remarks', 'Route_ID', 'Vehicle_ID', 'Lat_User', 'Long_User', 'Fatigue']

// let CPTable;

// Init Map
$(document).ready(function () {
    createCPMap();
    plotMarkersOnMap(points_data, "none", markerLayer);
    generateCPCards(points_data, document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");

    // Upload Points -> Generate CP Cards + Search Bar + Downlaod Xlsx
    // Get the reference to the button and the input field
    const uploadButton = document.getElementById('btn-upload-file');
    const fileInput = document.getElementById('input-route-sheet');

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

            // Assuming there is only one sheet in the Excel file
            var sheetName = workbook.SheetNames[0];
            var sheet = workbook.Sheets[sheetName];

            // Convert sheet data to JSON format
            var jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });

            // Add an index column to row in jsonData
            jsonData.forEach((row, index) => {
                row['id'] = index;
                const rowRouteName = row['Route_ID'];
                const rowVehicleName = row['Vehicle_ID'];
                const route = routes_data.find(route => route['Name'] == rowRouteName);
                const vehicle = vehicles_data.find(vehicle => vehicle['Name'] == rowVehicleName);
                if (route) {
                    row['Route_ID'] = route['id'];
                } else {
                    console.error(`Route with name '${rowRouteName}' not found`);
                }
                if (vehicle) {
                    row['Vehicle_ID'] = vehicle['id'];
                } else {
                    console.error(`Vehicle with name '${rowVehicleName}' not found`);
                }

                // const columnsToAdd = ["id", "House", "Street", "Alias", "Postal_Code", "Premises", "Direct Collection", "Allowed_Veh", "Ideal_Vehicle_Type",
                // "Service_Time_min", "Vehicle_Type_Allowed", "Min_Collection_Time_hrs", "Max_Collection_Time_hrs", "Time_Collected_hrs", "Tonnage_kg", "Manpower", 
                // "Remarks", "Route_ID", "Vehicle_ID", "Lat_User", "Long_User", "Fatigue", "Leg", "Node_Osmid", "Node_Latlong", "User_LongLat", "Poly_Cluster", 
                // "Network_Cluster", "Network_Vehicle_Type_Allowed", "User_Timing", "Cluster_Start", "Cluster_End"];
                // columnsToAdd.forEach(columnName => {
                //     if (!(columnName in row)) {
                //         row[columnName] = null;
                //     }
                // });

                if (!('Completed' in row)) {
                    row['Completed'] = false;
                } 
            });
            
            points_data = [...jsonData];
            updatePointsData();
            plotMarkersOnMap(jsonData, "none", markerLayer);
            clearAllCards(document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");
            generateCPCards(jsonData, document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");
        };
        reader.readAsArrayBuffer(file);
    });

    // Download Excel Button
    document.getElementById("btn-download-file").addEventListener("click", function(){
        $('#download-cp-excel-modal').modal('show');

        // Remove previous event listener if exists
        document.getElementById('btn-confirm-download-cp-excel').removeEventListener('click', confirmDownload);

        // Event listener for the confirm download button in the modal
        document.getElementById('btn-confirm-download-cp-excel').addEventListener('click', confirmDownload);

        // Event listener for the cancel download button in the modal
        document.getElementById('btn-cancel-download-cp-excel').addEventListener('click', function() {
            document.getElementById("input-cp-excel-filename").value = "";
        });
    });

    function confirmDownload() {
        var filename = document.getElementById("input-cp-excel-filename").value;

        // Append ".xlsx" to the filename if it's not already present
        if (!filename.endsWith('.xlsx')) {
            filename += '.xlsx';
        }

        console.log(points_data);
        const mappedData = points_data.map(point => {
            const newPoint = { ...point };

            newPoint['Route_ID'] = routes_data.find(route => route['id'] == point['Route_ID'])['Name'];
            newPoint['Ideal_Vehicle_Type'] = vehicle_types_data.find(vehType => vehType['id'] == point['Ideal_Vehicle_Type'])['Name'];
            newPoint['Vehicle_ID'] = vehicles_data.find(vehicle => vehicle['id'] == point['Vehicle_ID'])['Name'];

            // const { id, Completed, Allowed_Veh, Node_Osmid, Node_Latlong, User_LongLat, Poly_Cluster, Network_Cluster, Network_Vehicle_Type_Allowed, User_Timing, Cluster_Start, Cluster_End, ...rest } = point;
            // return rest;
            return newPoint;
        });
        

        // Save workbook as XLSX file and trigger download
        const data = Object.values(mappedData);
        const headers = Object.keys(data[0]); // Get keys as headers
        const dataArray = [headers, ...data.map(obj => Object.values(obj))];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dataArray);
        XLSX.utils.book_append_sheet(wb, ws, filename);
        XLSX.writeFile(wb, filename);

        document.getElementById("input-cp-excel-filename").value = "";
        $('#download-cp-excel-modal').modal('hide');
        console.log("Downloaded", filename);
    }

    // Hide Markers Button
    document.getElementById("btn-hide-markers").addEventListener("click", function(){
        if (this.dataset.hidden === "hidden") {
            var filteredCardsSet = searchCards(document.getElementById('input-search-cp').value, document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");
            plotMarkersOnMap(points_data.filter(point => filteredCardsSet.has(String(point['id']))), "none", markerLayer);
            this.textContent = 'Hide Markers';
            this.dataset.hidden = "shown";
            this.classList.remove('hidden');
        } else {
            clearMapLayer(markerLayer);
            this.textContent = 'Show Markers';
            clearMapLayer(clickedMarkerLayer);
            this.dataset.hidden = "hidden";
            this.classList.add('hidden');
        }
    });

    // Search Collection Points
    document.getElementById('input-search-cp').addEventListener('input', function() {
        var filteredCardsSet = searchCards(this.value, document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");
        clearMapLayer(markerLayer);
        clearMapLayer(clickedMarkerLayer);
        plotMarkersOnMap(points_data.filter(point => filteredCardsSet.has(String(point['id']))), "none", markerLayer);
        document.getElementById("btn-hide-markers").textContent = 'Hide Markers';
        document.getElementById("btn-hide-markers").dataset.hidden = "shown";
        document.getElementById("btn-hide-markers").classList.remove('hidden');
    });

    // First Collection Point Btn
    document.getElementById('btn-top-cp').addEventListener('click', function() {
        const container = document.getElementById('cp-cards-container');
        scrollToTop(container);
    });

    // Open Geotab Modal
    document.getElementById('btn-geotab').addEventListener('click', function() {
        $('#geotab-modal').modal('show');

        const vehicleSelect = document.getElementById('input-geotab-vehicle-id');
        vehicleSelect.innerHTML = '';
        vehicles_data.forEach(vehicle => {
            const vehicleOption = document.createElement('option');
            vehicleOption.value = vehicle['Name'];
            vehicleOption.textContent = vehicle['Name'];
            if (vehicle['id'] == 4) { 
                vehicleOption.selected = true;
            }
            vehicleSelect.appendChild(vehicleOption);
        });
    });

    // Close Geotab Modal
    document.getElementById('btn-close-geotab-modal').addEventListener('click', function() {
        resetCalendarInputs();
    });

    // Plot from Geotab
    document.getElementById('btn-plot-geotab-points').addEventListener('click', function() {
        alert("Disabled for demo version!");
        // const loadingAnimation = document.querySelector('.loading-screen');
        // loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 0.6)';
        // loadingAnimation.style.display = 'flex';

        // // Extract input values
        // var vehicleId = document.getElementById("input-geotab-vehicle-id").value.toUpperCase();
        // var fromDate = document.getElementById("input-geotab-from-date").value;
        // var toDate = document.getElementById("input-geotab-to-date").value;
        
        // // Make a GET request to the Flask endpoint
        // fetch(`/get_geotab_data/${vehicleId}/${fromDate}/${toDate}`)
        // .then(response => response.json())
        // .then(data => {
        //     console.log(data);
        //     plotGeotabMarkersOnMap(data);
        //     $('#geotab-modal').modal('hide');
        //     loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 1)';
        //     loadingAnimation.style.display = 'none';
        // })
        // .catch(error => {
        //     console.error('Error:', error);
        //     loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 1)';
        //     loadingAnimation.style.display = 'none';
        //     alert('An error occurred while fetching data, please try again or try another date!');
        // });
    });

    // Clear Upload Button
    document.getElementById('btn-clear-route-sheet').addEventListener('click', function() {
        resetCPMap();
        clearAllCards(document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");
        // resetTable(CPTable, document.getElementById('cp-table-container'));
        document.getElementById('input-route-sheet').value = ''; // Clear file upload
        document.getElementById('btn-upload-file').textContent = "Upload Excel"; // Reset Upload Excel Button
    });

    // Clear Geotab Button
    document.getElementById('btn-clear-geotab').addEventListener('click', function() {
        resetGeotabMap();
    });
});

