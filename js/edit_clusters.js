let Current_Cluster_ID;
let clusters_data_copy ;
let points_data_copy;

$(document).ready(function () {
    clusters_data_copy = [ ...clusters_data ];
    points_data_copy = [ ...points_data ];
    createClusterMap();
    generateCPCards(points_data, document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
    clearAllCards(document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
    generateClusterCards(clusters_data, points_data, document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
    plotCPMarkersOnClusterMap(points_data, "circle", markerLayer, false);
});

$(document).ready(function () {
    document.getElementById('btn-expand-collapse-cluster-cp').addEventListener('click', toggleCPColumnExpandCollapse);

    // Save changes
    document.getElementById('btn-save-edit-clusters').addEventListener('click', function () {
        clusters_data = [ ...clusters_data_copy ];
        points_data = [ ...points_data_copy ];
        updateClustersData();
        updatePointsData(() => {
            alert('Saved!');
        });
    });

    // // Auto Cluster Button
    // document.getElementById('btn-auto-cluster').addEventListener('click', function() {
    //     const loadingAnimation = document.querySelector('.loading-screen');
    //     loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 0.6)';
    //     loadingAnimation.style.display = 'flex';
        
    //     // Wait for 3 seconds before hiding the loading animation
    //     setTimeout(function() {
    //         clearAllCards(document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
    //         generateClusterCards(clusters_data_copy, points_data, document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
    //         plotMarkersOnMap(points_data, "circle", markerLayer, false);
    //         loadingAnimation.style.backgroundColor = 'rgba(68, 68, 68, 1)';
    //         loadingAnimation.style.display = 'none';
    //     }, 1000);
    // });

    // Add event listener to plot marker when click on collection point
    document.getElementById('all-cp-cards-container').querySelectorAll('.card').forEach(card => 
        card.addEventListener('click', function () {
            clearMapLayer(clickedCPMarkerLayer);
            plotMarkersOnMap([points_data_copy.find(point => point['id'] == card.dataset.index)], "none", clickedCPMarkerLayer, false);
            scrollToCardByIndex(points_data_copy.find(point => point['id'] == card.dataset.index)['Network_Cluster'], document.getElementById('cluster-cards-container'));
        })
    )

    // Download Clusters Button
    document.getElementById('btn-download-clusters').addEventListener("click", function(){
        $('#download-clusters-excel-modal').modal('show');

        // Event listener for the confirm download button in the modal
        document.getElementById('btn-confirm-download-clusters-excel').addEventListener('click', function() {
            var filename = document.getElementById("input-clusters-excel-filename").value;

            // Append ".xlsx" to the filename if it's not already present
            if (!filename.endsWith('.xlsx')) {
                filename += '.xlsx';
            }

            // Save workbook as XLSX file and trigger download
            const data = Object.values(clusters_data);
            const headers = Object.keys(data[0]); // Get keys as headers
            const dataArray = [headers, ...data.map(obj => Object.values(obj))];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(dataArray);
            XLSX.utils.book_append_sheet(wb, ws, filename);
            XLSX.writeFile(wb, filename);

            document.getElementById("input-clusters-excel-filename").value = "";
            $('#download-clusters-excel-modal').modal('hide');
        });

        // Event listener for the cancel download button in the modal
        document.getElementById('btn-cancel-download-clusters-excel').addEventListener('click', function() {
            document.getElementById("input-clusters-excel-filename").value = "";
        });
    });

    // Search All Collection Points
    document.getElementById('input-search-all-cp').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points");
    });

    // Search Clusters
    document.getElementById('input-search-cluster').addEventListener('input', function() {
        searchCards(this.value, document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
        clearMapLayer(markerLayer);
        var filteredCardsSet = searchCards(document.getElementById('input-search-cluster').value, document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
        plotMarkersOnMap(points_data_copy.filter(point => filteredCardsSet.has(String(point['Network_Cluster']))), "circle", markerLayer, false);
    });

    // First Collection Point Btn (Cluster CP)
    document.getElementById('btn-top-cluster-cp').addEventListener('click', function() {
        scrollToTop(document.getElementById('cluster-cp-cards-container'));
    });

    // First Collection Point Btn (All CP)
    document.getElementById('btn-top-all-cp').addEventListener('click', function() {
        scrollToTop(document.getElementById('all-cp-cards-container'));
    });

    // Filter Unclustered CPs (All CP)
    document.getElementById('btn-unclustered-cp').addEventListener('click', function() {
        if (this.classList.contains('unclustered')) {
            clearAllCards(document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points");
            if (Current_Cluster_ID) {
                generateCPCards(points_data_copy.filter(point => point.Network_Cluster != Current_Cluster_ID), document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
            } else {
                generateCPCards(points_data_copy, document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
            }
            this.classList.remove('unclustered');
        } else {
            clearAllCards(document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points");
            generateCPCards(points_data_copy.filter(point => point.Network_Cluster == null), document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
            this.classList.add('unclustered');
        }
    });

    // First Cluster Btn (Cluster)
    document.getElementById('btn-top-cluster').addEventListener('click', function() {
        scrollToTop(document.getElementById('cluster-cards-container'));
    });

    // Create Cluster Btn (Cluster)
    document.getElementById('btn-create-cluster').addEventListener('click', function() {
        showTempCluster();
    });

    // Dragging all-cp-container -> cluster-cp-container (Add)
    document.getElementById('cluster-cp-cards-container').addEventListener('drop', function(event) {
        event.preventDefault();

        const draggedIndex = event.dataTransfer.getData('cardIndex');
        var point = points_data_copy.find(point => point['id'] == draggedIndex);
        if (point['Network_Cluster'] != Current_Cluster_ID) {
            dragDropCard(draggedIndex, document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), this, document.getElementById('cluster-cp-cards-count'), " Collection Points");
            addCPToCluster(draggedIndex, Current_Cluster_ID);  
            try {   
                removeCPFromCluster(draggedIndex, point.Network_Cluster);
            } catch {
                console.error("Point has no cluster!");
            }
            point['Network_Cluster'] = Current_Cluster_ID;
            plotClusterMarkersOnMap([point], "none", clusterMarkerLayer);
            changeClusterMarkerColour(point['id']);
            scrollToCardByIndex(draggedIndex, document.getElementById('cluster-cp-cards-container'));
            updateCPCardContent(draggedIndex, points_data_copy.find(point => point['id'] == draggedIndex), document.getElementById('cluster-cp-cards-container'));
            updateCPOverlayContent(markers.find(marker => marker.index == draggedIndex), null, false);
            updateClusterOverlayContent(Current_Cluster_ID, false);
        }
    });

    // Add dragover event listener to cluster-cp-cards-container to handle dragging over the drop target
    document.getElementById('cluster-cp-cards-container').addEventListener('dragover', function(event) {
        event.preventDefault();
    });


    // Dragging cluster-cp-container -> all-cp-container (Remove)
    // Add drop event listener to cluster-cp-cards-container to handle dropping
    document.getElementById('all-cp-cards-container').addEventListener('drop', function(event) {
        event.preventDefault();

        const draggedIndex = event.dataTransfer.getData('cardIndex');
        if (points_data_copy.find(point => point['id'] == draggedIndex)['Network_Cluster'] == Current_Cluster_ID) {
            dragDropCard(draggedIndex, document.getElementById('cluster-cp-cards-container'), document.getElementById('cluster-cp-cards-count'), this, document.getElementById('all-cp-cards-count'), " Collection Points");
            removeCPFromCluster(draggedIndex, Current_Cluster_ID);
            points_data_copy.find(point => point['id'] == draggedIndex)['Network_Cluster'] = null;
            updateCPCardContent(draggedIndex, points_data_copy.find(point => point['id'] == draggedIndex), document.getElementById('all-cp-cards-container'));
            updateClusterOverlayContent(Current_Cluster_ID, false);
            changeClusterMarkerColour(draggedIndex);
            clearMapLayer(clusterMarkerLayer);
            plotClusterMarkersOnMap(points_data_copy.filter(point => point.Network_Cluster == Current_Cluster_ID), "none", clusterMarkerLayer);
            updateCPOverlayContent(markers.find(marker => marker.index == draggedIndex), null, false);
        }
    });

    // Add dragover event listener to cluster-cp-cards-container to handle dragging over the drop target
    document.getElementById('all-cp-cards-container').addEventListener('dragover', function(event) {
        event.preventDefault();
    });
});

function addCPToCluster(pointID, clusterID) {
    var point = points_data_copy.find(point => point['id'] == pointID);
    var cluster = clusters_data_copy.find(cluster => cluster['Cluster_ID'] == clusterID);

    // Update cluster properties
    cluster['Cluster_Load'] = (Number(cluster['Cluster_Load']) || 0) + (Number(point['Tonnage_kg']) || 0);
    cluster['Cluster_Service_Time'] = (Number(cluster['Cluster_Service_Time']) || 0) + (Number(point['Service_Time_min']) || 0);
    cluster['Cluster_Points_Count'] = (Number(cluster['Cluster_Points_Count']) || 0) + 1;
    cluster['Cluster_Manpower'] = Math.max(cluster['Cluster_Manpower'] || 0, point['Manpower'] || 0);

    // Update Cluster TW
    let minCollectionTime = Infinity;
    let maxCollectionTime = -Infinity;
    points_data.filter(point => point['Network_Cluster'] === clusterID).forEach(point => {
        minCollectionTime = Math.min(minCollectionTime, point.Min_Collection_Time_hrs);
        maxCollectionTime = Math.max(maxCollectionTime, point.Max_Collection_Time_hrs);
    });
    cluster['Cluster_TW'] = [minCollectionTime, maxCollectionTime];

    // Update Cluster Restriction
    const allowedVehiclesSet = new Set();
    points_data_copy
    .filter(point => point['Network_Cluster'] == clusterID)
    .forEach(point => {
        if (typeof point.Allowed_Veh === 'string' && point.Allowed_Veh.trim() !== '') {
            const vehicles = point.Allowed_Veh.split(',').map(vehicle => vehicle.trim());
            vehicles.forEach(vehicle => allowedVehiclesSet.add(vehicle));
        } else if (Array.isArray(point.Allowed_Veh) && point.Allowed_Veh.length > 0) {
            point.Allowed_Veh.forEach(vehicle => allowedVehiclesSet.add(vehicle.toString()));
        } else if (typeof point.Allowed_Veh === 'number') {
            allowedVehiclesSet.add(point.Allowed_Veh.toString());
        }
    });
    cluster['Cluster_Restrictions'] = Array.from(allowedVehiclesSet).join(',');

    // Update cluster midpoints
    cluster['Cluster_Midpoints'] = [
        (cluster['Cluster_Midpoints'][0] * (cluster['Cluster_Points_Count'] - 1) + point['Lat_User']) / cluster['Cluster_Points_Count'],
        (cluster['Cluster_Midpoints'][1] * (cluster['Cluster_Points_Count'] - 1) + point['Long_User']) / cluster['Cluster_Points_Count']
    ];

    updateClusterCardContent(clusterID, cluster, document.getElementById('cluster-cards-container'));
}

function removeCPFromCluster(pointID, clusterID) {
    var point = points_data_copy.find(point => point['id'] == pointID);
    var cluster = clusters_data_copy.find(cluster => cluster['Cluster_ID'] == clusterID);

    // Update the Cluster
    cluster['Cluster_Load'] = (Number(cluster['Cluster_Load']) || 0) - (Number(point['Tonnage_kg']) || 0);
    cluster['Cluster_Service_Time'] = (Number(cluster['Cluster_Service_Time']) || 0) - (Number(point['Service_Time_min']) || 0);
    cluster['Cluster_Points_Count'] = (Number(cluster['Cluster_Points_Count']) || 0) - 1;

    // Update cluster midpoints
    if (cluster['Cluster_Points_Count'] > 0) {
        cluster['Cluster_Midpoints'] = [
            (cluster['Cluster_Midpoints'][0] * (cluster['Cluster_Points_Count'] + 1) - point['Lat_User']) / cluster['Cluster_Points_Count'],
            (cluster['Cluster_Midpoints'][1] * (cluster['Cluster_Points_Count'] + 1) - point['Long_User']) / cluster['Cluster_Points_Count']
        ];

        // Update Cluster TW
        let minCollectionTime = Infinity;
        let maxCollectionTime = -Infinity;
        points_data.filter(point => point['Network_Cluster'] === clusterID).forEach(point => {
            minCollectionTime = Math.min(minCollectionTime, point.Min_Collection_Time_hrs);
            maxCollectionTime = Math.max(maxCollectionTime, point.Max_Collection_Time_hrs);
        });
        cluster['Cluster_TW'] = [minCollectionTime, maxCollectionTime];

        // Update Cluster Restriction
        const allowedVehiclesSet = new Set();
        points_data_copy
        .filter(point => point['Network_Cluster'] == clusterID && point['id'] != pointID)
        .forEach(point => {
            if (typeof point.Allowed_Veh === 'string' && point.Allowed_Veh.trim() !== '') {
                const vehicles = point.Allowed_Veh.split(',').map(vehicle => vehicle.trim());
                vehicles.forEach(vehicle => allowedVehiclesSet.add(vehicle));
            } else if (Array.isArray(point.Allowed_Veh) && point.Allowed_Veh.length > 0) {
                point.Allowed_Veh.forEach(vehicle => allowedVehiclesSet.add(vehicle.toString()));
            } else if (typeof point.Allowed_Veh === 'number') {
                allowedVehiclesSet.add(point.Allowed_Veh.toString());
            }
        });
        cluster['Cluster_Restrictions'] = Array.from(allowedVehiclesSet).join(',');
    } else {
        // Reset midpoints if no points left in the cluster
        cluster['Cluster_Midpoints'] = [1.281651,103.829894];
        cluster['Cluster_TW'] = [0, 0];
        cluster['Cluster_Restrictions'] = "";
    }

    // Update cluster manpower
    // cluster['Cluster_Manpower'] = Math.max(cluster['Cluster_Manpower'] || 0, point['Manpower'] || 0);

    updateClusterCardContent(point['Network_Cluster'], cluster, document.getElementById('cluster-cards-container'));
    // point['Network_Cluster'] = clusterID;
    // clearMapLayer(clusterMarkerLayer);
    // plotClusterMarkersOnMap(points_data_copy.filter(point => point.Network_Cluster == Current_Cluster_ID), "none", clusterMarkerLayer);
    // changeClusterMarkerColour(pointID);
}

function toggleCPColumnExpandCollapse() {
    const btnExpandCollapse = document.getElementById('btn-expand-collapse-cluster-cp');
    const imgElement = btnExpandCollapse.querySelector('img');
    const currentState = imgElement.getAttribute('data-state');

    // Toggle between collapsed and expanded states
    if (currentState === 'collapsed') {
        document.getElementById('cluster-cp-column').style.height = 'calc(50% - 15px)';
        document.getElementById('all-cp-column').style.height = 'calc(50% - 15px)';
        imgElement.setAttribute('src', '/static/icons/icons8-triangle-up-32.png');
        imgElement.setAttribute('data-state', 'expanded');
    } else {
        document.getElementById('cluster-cp-column').style.height = '60px';
        document.getElementById('all-cp-column').style.height = 'calc(100% - 87px)';
        imgElement.setAttribute('src', '/static/icons/icons8-triangle-down-32.png');
        imgElement.setAttribute('data-state', 'collapsed');
    }
}

function setCurrentClusterID(clusterID) {
    Current_Cluster_ID = clusterID;
}

function handleDeleteCluster(clusterID) {
    setCurrentClusterID(null);

    const btnExpandCollapse = document.getElementById('btn-expand-collapse-cluster-cp');
    const imgElement = btnExpandCollapse.querySelector('img');
    document.getElementById('cluster-cp-column').style.height = '60px';
    document.getElementById('all-cp-column').style.height = 'calc(100% - 87px)';
    imgElement.setAttribute('src', '/static/icons/icons8-triangle-down-32.png');
    imgElement.setAttribute('data-state', 'collapsed');
    document.getElementById('cluster-id-display').textContent = 'No CLuster';

    deleteCard(clusterID, document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
    clearMapLayer(clusterMarkerLayer);

    clusters_data = clusters_data.filter(cluster => cluster['Cluster_ID'] != clusterID);
    updateClustersData();

    const filteredPoints = points_data.filter(point => point['Network_Cluster'] == clusterID);
    for (let i = 0; i < filteredPoints.length; i++) {
        points_data[points_data.indexOf(filteredPoints[i])]['Network_Cluster'] = null;
    }
    updatePointsData();

    clearAllCards(document.getElementById('cluster-cp-cards-container'), document.getElementById('cluster-cp-cards-count'), " Cluster Collection Points");
    clearAllCards(document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points");
    if (document.getElementById('btn-unclustered-cp').classList.contains('unclustered')) {
        generateCPCards(points_data_copy.filter(point => point.Network_Cluster == null), document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
    } else {
        generateCPCards(points_data_copy, document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
    }
}

function handleChangeClusterName(clusterID) {
    points_data.filter(point => point['Network_Cluster'] == clusterID).forEach(point => {
        updateCPCardContent(point['id'], point, document.getElementById('cluster-cp-cards-container'));
    });
}


// Cluster Cards
function generateClusterCards(clusterData, pointsData, container, countElement, appendText) {
    // Loop through jsonData and create a card for each cluster
    clusterData.forEach(cluster => {
        // Create card element
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('cluster-card');
        card.setAttribute('data-index', cluster['Cluster_ID']);

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = cluster['Cluster_Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const totalTonnageText = document.createElement('p');
        totalTonnageText.textContent = `Tonnage: ${cluster['Cluster_Load']} kg`;
        totalTonnageText.classList.add('cluster-card-row-item');
        cardBody.appendChild(totalTonnageText);

        const clusterCountText = document.createElement('p');
        clusterCountText.textContent = `Points: ${cluster['Cluster_Points_Count']}`;
        clusterCountText.classList.add('cluster-card-row-item');
        cardBody.appendChild(clusterCountText);

        const clutserServiceTimeText = document.createElement('p');
        clutserServiceTimeText.textContent = `Service Time: ${cluster['Cluster_Service_Time']} mins`;
        clutserServiceTimeText.classList.add('cluster-card-row-item');
        cardBody.appendChild(clutserServiceTimeText);

        // Add click event listener
        card.addEventListener('click', () => {
            $('#btn-cancel-cluster').off('click');
            $('#btn-save-cluster').off('click');
            $('#btn-close-cluster-overlay').off('click');
            $('#btn-delete-cluster').off('click');
            $('#btn-edit-cluster').off('click');

            Current_Cluster_ID = cluster.Cluster_ID;
            document.getElementById('cluster-id-display').textContent = cluster.Cluster_Name;
            if (document.getElementById('btn-expand-collapse-cluster-cp').querySelector('img').getAttribute('data-state') == "collapsed") {
                toggleCPColumnExpandCollapse();
            }
            
            points_in_cluster = pointsData.filter(point => point.Network_Cluster == Current_Cluster_ID);
            points_not_in_cluster = pointsData.filter(point => point.Network_Cluster !== cluster.Cluster_ID);
            
            // Cluster CP Cards Container
            clearAllCards(document.getElementById('cluster-cp-cards-container'), document.getElementById('cluster-cp-cards-count'), " Cluster Collection Points");
            generateCPCards(points_in_cluster, document.getElementById('cluster-cp-cards-container'), document.getElementById('cluster-cp-cards-count'), " Cluster Collection Points", false, true, true);

            
            // All CP Cards Container
            clearAllCards(document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points");
            generateCPCards(points_not_in_cluster, document.getElementById('all-cp-cards-container'), document.getElementById('all-cp-cards-count'), " Collection Points", false, true, true);
            document.getElementById('btn-unclustered-cp').classList.remove('unclustered');

            // Map
            // plotPolygon(clusterStats[cluster.Cluster_ID].coordinates);
            clearMapLayer(clusterMarkerLayer);
            clearMapLayer(clickedCPMarkerLayer);
            showClickedCluster(cluster.Cluster_ID)
            plotClusterMarkersOnMap(points_in_cluster, "none", clusterMarkerLayer);
            focusCluster(cluster.Cluster_Midpoints);

            container.querySelectorAll('.card').forEach(card => {
                card.classList.remove('card-focused');
            });
            card.classList.add('card-focused');
        });

        card.addEventListener('drop', function(event) {
            event.preventDefault();

            const draggedIndex = event.dataTransfer.getData('cardIndex');
            var point = points_data_copy.find(point => point['id'] == draggedIndex);
            
            if (point['Network_Cluster'] != card.dataset.index) {
                try {
                    const draggedCardCluster = document.getElementById('cluster-cp-cards-container').querySelector(`[data-index="${draggedIndex}"]`);
                    draggedCardCluster.remove();
                } catch (error) {
                    try {
                        const draggedCardAll = document.getElementById('all-cp-cards-container').querySelector(`[data-index="${draggedIndex}"]`);
                        draggedCardAll.remove();
                        if (card.dataset.index == Current_Cluster_ID) {
                            document.getElementById('cluster-cp-cards-container').appendChild(draggedCardAll);
                            scrollToCardByIndex(draggedIndex,document.getElementById('cluster-cp-cards-container'));
                            updateCardsCount(document.getElementById('cluster-cp-cards-container'),document.getElementById('cluster-cp-cards-count'), " Cluster Collection Points");
                        }
                    } catch (error) {
                        console.error('Element not found in any container:', error);
                    }
                }
                
                addCPToCluster(draggedIndex, card.dataset.index);  
                try {   
                    removeCPFromCluster(draggedIndex, point.Network_Cluster);
                } catch {
                    console.error("Point has no cluster!");
                }
                point['Network_Cluster'] = parseInt(card.dataset.index);
                changeClusterMarkerColour(point['id']);
                clearMapLayer(clusterMarkerLayer);
                plotClusterMarkersOnMap(points_data_copy.filter(point => point.Network_Cluster == Current_Cluster_ID), "none", clusterMarkerLayer);
                updateCPOverlayContent(markers.find(marker => marker.index == draggedIndex), null, false);
            }
        });

        card.addEventListener('dragover', function(event) {
                event.preventDefault();
        });

        // Append card to container
        container.appendChild(card);
    });
    updateCardsCount(container, countElement, appendText);
}

function updateClusterCardContent(clusterID, newData, container) {
    // Get the card element by its index within the container
    const card = container.querySelector(`.card[data-index="${clusterID}"]`);

    if (card) {
        // Clear existing content
        card.innerHTML = '';

        // Create card title
        const cardTitle = document.createElement('div');
        cardTitle.classList.add('cluster-card-title');
        card.appendChild(cardTitle);

        // Populate card title with data
        const span = document.createElement('span');
        span.textContent = newData['Cluster_Name'] || '';
        cardTitle.appendChild(span);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        card.appendChild(cardBody);

        // Populate card body with data
        const totalTonnageText = document.createElement('p');
        totalTonnageText.classList.add('cluster-card-row-item');
        totalTonnageText.textContent = `Tonnage: ${newData['Cluster_Load']} kg`;
        cardBody.appendChild(totalTonnageText);

        const clusterCountText = document.createElement('p');
        clusterCountText.classList.add('cluster-card-row-item');
        clusterCountText.textContent = `Points: ${newData['Cluster_Points_Count']}`;
        cardBody.appendChild(clusterCountText);

        const clutserServiceTimeText = document.createElement('p');
        clutserServiceTimeText.classList.add('cluster-card-row-item');
        clutserServiceTimeText.textContent = `Service Time: ${newData['Cluster_Service_Time']} mins`;
        cardBody.appendChild(clutserServiceTimeText);

    } else {
        console.error('Card not found for index:', clusterID);
    }
}