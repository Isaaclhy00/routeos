let map;
let tiles;

let markers = [];
let markerLayer;
let clickedMarkerLayer;

let geotabMarkersByDate = {};

let layerControl = null;
let currentTempMarker = null;


function clearMapLayer(layer) {
  layer.clearLayers();
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

function findElementById(searchDomain, idToFind, idFieldName) {
  return searchDomain.find(element => element[idFieldName] == idToFind);
}

function getColor(index) {
  return index === null ? '#000000' : `hsl(${(index * 137.508) % 360}, 70%, 50%)`;
}

// Collection Points Functions
async function createCPMap() {
  map = L.map('map', { zoomControl: false }).setView([1.281651,103.829894], 12);
  tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  clickedMarkerLayer = L.layerGroup().addTo(map);

  // Handle right click map to add point
  map.on('contextmenu', function(event) {
    // Remove previously unsvaed tempMarker on multiple right-clicks
    if (currentTempMarker) {
      map.removeLayer(currentTempMarker);
    }

    var tempMarker = L.marker([event.latlng.lat, event.latlng.lng], { 
      draggable: true
    }).addTo(map);

    var tempMarkerData = {
      'House' : "house",
      'Street' : "street",
      'Alias' : "alias",
      'Postal_Code' : "postal",
      'Premises' : "premises",
      'Direct Collection' : "Y",
      'Allowed_Veh' : 7,
      'Ideal_Vehicle_Type' : "8x2",
      'Service_Time_min' : 200,
      'Vehicle_Type_Allowed' : "8x2,6x4,4x2",
      'Min_Collection_Time_hrs' : 0,
      'Max_Collection_Time_hrs' : 0,
      'Time_Collected_hrs' : 0,
      'Tonnage_kg' : 0,
      'Manpower' : 0,
      'Remarks' : "remarks",
      'Route_ID' : "R26X",
      'Vehicle_ID' : 0,
      'Lat_User' : event.latlng.lat,
      'Long_User' : event.latlng.lng,
      'Fatigue' : 0,
      'Network_Cluster' : null,
      'id' : getMaxId(points_data, "id") + 1,
    };
     
    tempMarker.markerData = tempMarkerData;
    tempMarker.index = tempMarkerData['id'];

    // Show tempMarker information
    showTempMarker(tempMarker);
    
    // Bind drag event to marker
    tempMarker.on("dragend", onTempMarkerDragEndFactory(tempMarker));
    currentTempMarker = tempMarker;
  })
}

function resetCPOverlay() {
  $('.cp-data').attr('contenteditable', false);
  $('.cp-data[contentEditable="false"]').removeClass('editable');
  $('#btn-save-cp, #btn-cancel-cp').hide();
  $('#cp-route-id-display').show();
  $('#cp-route-id-select').hide();
}

function resetCPMap() {
  map.setView([1.281651,103.829894], 12);
  markers.forEach(marker => map.removeLayer(marker));
  if (currentTempMarker) {
    map.removeLayer(currentTempMarker);
  }
  currentTempMarker = null;
  markers = [];

  $('#cp-overlay').hide();
  resetCPOverlay();
}

function resetGeotabMap() {
  map.setView([1.281651,103.829894], 12);

  // Remove all geotab markers from the map
  for (var date in geotabMarkersByDate) {
    geotabMarkersByDate[date].eachLayer(function(marker) {
      map.removeLayer(marker);
    });
    geotabMarkersByDate[date].clearLayers();
  }

  // Clear the geotabMarkersByDate object
  geotabMarkersByDate = {};

  // Remove layer control
  if (layerControl) {
    map.removeControl(layerControl);
  }
  layerControl = null;
}

function plotMarkersOnMap(jsonData, icon, targetLayer, allowEdit=true) {
  // Loop through JSON data to add markers to the map
  jsonData.forEach(point => {
    if (!points_data.includes(point)) {
      points_data.push(point);
    }
    
    var lat = point['Lat_User']; 
    var lng = point['Long_User']; 
    
    var marker;
    if (icon == "circle") {
      marker = L.circleMarker([lat, lng], {
        radius : 5,
        color  : getColor(parseInt(point['Network_Cluster'])),
        draggable: false,
      });
    } else if (icon == "circleLarge") {
      marker = L.circleMarker([lat, lng], {
        radius : 10,
        color  : getColor(parseInt(point['Network_Cluster'])),
        draggable: false,
      });
    } else {
      marker = L.marker([lat, lng], { 
        draggable: false,
      });
    }
    marker.addTo(targetLayer);

    marker.index = point['id'];
    marker.edit = false;
    marker.markerData = { ...point };
    markers.push(marker);

    // Bind click event to marker to show point information
    marker.on('click', function() {
      //Remove previously unsvaed tempMarker on multiple right-clicks
      if (currentTempMarker) {
        map.removeLayer(currentTempMarker);
      }
      
      $('#btn-cancel-cp').off('click');
      $('#btn-save-cp').off('click');
      $('#btn-close-cp-overlay').off('click');
      $('#btn-delete-cp').off('click');
      $('#btn-edit-cp').off('click');
      
      // showClickedMarker(this, allowEdit);
      focusMarker(marker.index, allowEdit);
      scrollToCardByIndex(this.index, document.getElementById('cp-cards-container'));
      scrollToCardByIndex(this.index, document.getElementById('all-cp-cards-container'));
      scrollToCardByIndex(this.index, document.getElementById('cluster-cp-cards-container'));
    });
    
    // Bind drag event to marker
    marker.on("dragend", onMarkerDragEndFactory(marker));
  });
}

function plotGeotabMarkersOnMap(jsonData) {
  resetGeotabMap();

  // Loop through JSON data to add markers to the map and group them by date
  for (var i = 0; i < jsonData.length; i++) {
    var date = jsonData[i]['date']; 
    var lat = jsonData[i]['latitude']; 
    var lng = jsonData[i]['longitude']; 
    var geotabMarker = L.circleMarker([lat, lng], { 
      radius : 5,
      draggable: false,
      color: '#ff0000'
    });

    // Add the marker to the corresponding date group
    if (!geotabMarkersByDate[date]) {
      geotabMarkersByDate[date] = L.layerGroup();
    }
    geotabMarkersByDate[date].addLayer(geotabMarker);
  }

  // Add the layer control to the map
  layerControl = L.control.layers();
  for (var date in geotabMarkersByDate) {
    layerControl.addOverlay(geotabMarkersByDate[date], date, true);
  }
  layerControl.addTo(map);
}

function showClickedMarker(marker, allowEdit=true) {
  point = points_data.find(point => point['id'] == marker.index);

  // Show the cp-overlay
  $('#cluster-overlay').hide();
  $('#cp-overlay').show();
  updateCPOverlayContent(marker, null, allowEdit);
  
  // Bind click event to the close button to hide the cp-overlay
  $('#btn-close-cp-overlay').on('click', function() {
    marker.setLatLng([point['Lat_User'], point['Long_User']]);
    marker.edit = false;
    updateCPOverlayContent(marker, null, allowEdit);
    try{
      clearMapLayer(clickedMarkerLayer);
      plotMarkersOnMap([point], "circle", clickedMarkerLayer);
    } catch (error) {
      console.error("Error when clearing clickedMarkerLayer: ", error);
    }
    $('#cp-overlay').hide();
  });
  
  // Bind click event to the cancel button
  $('#btn-cancel-cp').on('click', function() {
    marker.setLatLng([point['Lat_User'], point['Long_User']]);
    marker.edit = false;
    updateCPOverlayContent(marker, null, allowEdit);
    clearMapLayer(clickedMarkerLayer);
    plotMarkersOnMap([point], "circle", clickedMarkerLayer);
  });
  
  // Bind click event to the save button
  $('#btn-save-cp').on('click', function() {
    point['House'] = $('#house').text();
    point['Street'] = $('#street').text();
    point['Alias'] = $('#alias').text();
    point['Postal_Code'] = $('#postal').text();
    point['Premises'] = $('#premises').text();
    point['Direct Collection'] = $('#directCollection').text();
    point['Ideal_Vehicle_Type'] = vehicle_types_data.find(vehType => vehType['id'] == $('#idealVehTypeDropdown').val())['id'];
    point['Service_Time_min'] = parseInt($('#serviceTime').text());
    point['Vehicle_Type_Allowed'] = $('#vehTypeAllowed').text();
    point['Min_Collection_Time_hrs'] = parseInt($('#collectionWindowStart').text());
    point['Max_Collection_Time_hrs'] = parseInt($('#collectionWindowEnd').text());
    point['Time_Collected_hrs'] = parseInt($('#timeCollected').text());
    point['Tonnage_kg'] = parseInt($('#tonnage').text());
    point['Manpower'] = parseInt($('#manpower').text());
    point['Remarks'] = $('#remarks').text();
    point['Route_ID'] = $('#routeIdDropdown').val();
    point['Vehicle_ID'] = $('#vehicleIDDropdown').val();
    // point['Network_Cluster'] = $('#networkCluster').text();
    point['Lat_User'] = marker.getLatLng().lat;
    point['Long_User'] = marker.getLatLng().lng;
    point['Fatigue'] = $('#fatigue').text();
    updatePointsData();
    marker.markerData = { ...point };

    marker.setLatLng([point['Lat_User'], point['Long_User']]);
    marker.edit = false;
    updateCPOverlayContent(marker, null, allowEdit);

    // Update CP Card
    updateCPCardContent(marker.index, marker.markerData, document.getElementById('cp-cards-container'));
});

  // Bind click event to the delete button to delete the collection point
  $('#btn-delete-cp').on('click', function() {
    $('#delete-cp-confirmation-modal').modal('show');
    $('#btn-confirm-delete-cp').on('click', function() {
      // Delete CP Card
      deleteCard(marker.index, document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points");

      // Delete from map
      markers = markers.filter(existingMarker => existingMarker !== marker);
      points_data = points_data.filter(point => point['id'] != marker.index);
      updatePointsData();
      map.removeLayer(marker);

      // Clean up
      resetCPOverlay();
      $('#cp-overlay').hide();
      $('#delete-cp-confirmation-modal').modal('hide');
    });
  });

  // Bind click event to the edit button to make fields editable
  $('#btn-edit-cp').on('click', function() {
    marker.edit = !marker.edit;
    updateCPOverlayContent(marker, null, allowEdit);

    $('#cp-route-id-display').hide();
    $('#cp-route-id-select').show();

    $('#cp-vehicle-id-display').hide();
    $('#cp-vehicle-id-select').show();

    $('#ideal-veh-type-display').hide();
    $('#ideal-veh-type-select').show();

    const vehicleRouteSelect = document.getElementById('routeIdDropdown');
    vehicleRouteSelect.innerHTML = '';
    routes_data.forEach(route => {
        const vehicleRouteOption = document.createElement('option');
        vehicleRouteOption.value = route['id'];
        vehicleRouteOption.textContent = route['Name'];
        if (route['id'] == marker.markerData['Route_ID']) { 
            vehicleRouteOption.selected = true;
        }
        vehicleRouteSelect.appendChild(vehicleRouteOption);
    });

    const vehicleTypeSelect = document.getElementById('idealVehTypeDropdown');
    vehicleTypeSelect.innerHTML = '';
    vehicle_types_data.forEach(vehicleType => {
        const vehicleTypeOption = document.createElement('option');
        vehicleTypeOption.value = vehicleType['id'];
        vehicleTypeOption.textContent = vehicleType['Name'];
        if (vehicleType['id'] == marker.markerData['Vehicle_Type']) { 
            vehicleTypeOption.selected = true;
        }
        vehicleTypeSelect.appendChild(vehicleTypeOption);
    });

    const vehicleSelect = document.getElementById('vehicleIDDropdown');
    vehicleSelect.innerHTML = '';
    vehicles_data.forEach(vehicle => {
        const vehicleOption = document.createElement('option');
        vehicleOption.value = vehicle['id'];
        vehicleOption.textContent = vehicle['Name'];
        if (vehicle['id'] == marker.markerData['Vehicle_ID']) { 
          vehicleOption.selected = true;
        }
        vehicleSelect.appendChild(vehicleOption);
    });

  });
}

function showTempMarker(tempMarker) {
  // Show the cp-overlay
  $('#cluster-overlay').hide();
  $('#cp-overlay').show();
  updateTempMarkerOverlayContent(tempMarker);
  
  $('#cp-route-id-display').hide();
  $('#cp-route-id-select').show();

  $('#ideal-veh-type-display').hide();
  $('#ideal-veh-type-select').show();

  const vehicleRouteSelect = document.getElementById('routeIdDropdown');
  vehicleRouteSelect.innerHTML = '';
  routes_data.forEach(route => {
      const vehicleRouteOption = document.createElement('option');
      vehicleRouteOption.value = route['id'];
      vehicleRouteOption.textContent = route['Name'];
      if (route['id'] === tempMarker.markerData['Route_ID']) { 
          vehicleRouteOption.selected = true;
      }
      vehicleRouteSelect.appendChild(vehicleRouteOption);
  });

  const vehicleTypeSelect = document.getElementById('idealVehTypeDropdown');
  vehicleTypeSelect.innerHTML = '';
  vehicle_types_data.forEach(vehicleType => {
      const vehicleTypeOption = document.createElement('option');
      vehicleTypeOption.value = vehicleType['id'];
      vehicleTypeOption.textContent = vehicleType['Name'];
      if (vehicleType['id'] === tempMarker.markerData['Vehicle_Type']) { 
          vehicleTypeOption.selected = true;
      }
      vehicleTypeSelect.appendChild(vehicleTypeOption);
  });

  const vehicleSelect = document.getElementById('vehicleIDDropdown');
    vehicleSelect.innerHTML = '';
    vehicles_data.forEach(vehicle => {
        const vehicleOption = document.createElement('option');
        vehicleOption.value = vehicle['id'];
        vehicleOption.textContent = vehicle['Name'];
        vehicleSelect.appendChild(vehicleOption);
    });

  // Bind click event to the close button to hide the cp-overlay
  $('#btn-close-cp-overlay').off('click').on('click', function() {
    map.removeLayer(tempMarker);
    resetCPOverlay();
    $('#btn-cancel-cp').off('click');
    $('#btn-save-cp').off('click');
    $('#btn-close-cp-overlay').off('click');
    $('#cp-overlay').hide();
  });
  
  // Bind click event to the cancel button
  $('#btn-cancel-cp').off('click').on('click', function() {
    map.removeLayer(tempMarker);
    resetCPOverlay();
    $('#btn-cancel-cp').off('click');
    $('#btn-save-cp').off('click');
    $('#btn-close-cp-overlay').off('click');
    $('#cp-overlay').hide();
  });
  
  // Bind click event to the save button
  $('#btn-save-cp').off('click').on('click', function() {
    tempMarker.markerData['House'] = $('#house').text();
    tempMarker.markerData['Street'] = $('#street').text();
    tempMarker.markerData['Alias'] = $('#alias').text();
    tempMarker.markerData['Postal_Code'] = $('#postal').text();
    tempMarker.markerData['Premises'] = $('#premises').text();
    tempMarker.markerData['Direct Collection'] = $('#directCollection').text();
    tempMarker.markerData['Ideal_Vehicle_Type'] = vehicle_types_data.find(vehType => vehType['id'] == $('#idealVehTypeDropdown').val())['id'];
    tempMarker.markerData['Service_Time_min'] = parseInt($('#serviceTime').text());
    tempMarker.markerData['Vehicle_Type_Allowed'] = $('#vehTypeAllowed').text();
    tempMarker.markerData['Min_Collection_Time_hrs'] = parseInt($('#collectionWindowStart').text());
    tempMarker.markerData['Max_Collection_Time_hrs'] = parseInt($('#collectionWindowEnd').text());
    tempMarker.markerData['Time_Collected_hrs'] = parseInt($('#timeCollected').text());
    tempMarker.markerData['Tonnage_kg'] = parseInt($('#tonnage').text());
    tempMarker.markerData['Manpower'] = parseInt($('#manpower').text());
    tempMarker.markerData['Remarks'] = $('#remarks').text();
    tempMarker.markerData['Route_ID'] = $('#routeIdDropdown').val();
    tempMarker.markerData['Vehicle_ID'] = $('#vehicleIDDropdown').val();
    tempMarker.markerData['Lat_User'] = tempMarker.getLatLng().lat;
    tempMarker.markerData['Long_User'] = tempMarker.getLatLng().lng;
    tempMarker.markerData['Fatigue'] = parseInt($('#fatigue').text());
    
    tempMarker.setLatLng([tempMarker.markerData['Lat_User'], tempMarker.markerData['Long_User']]);
    
    // Add tempMarker to map
    tempMarker.edit = false;
    points_data.push(tempMarker.markerData)
    updatePointsData();
    markers.push(tempMarker);
    tempMarker.addTo(markerLayer);

    // Add CP Card
    generateCPCards([{...tempMarker.markerData }], document.getElementById('cp-cards-container'), document.getElementById('cp-cards-count'), " Collection Points", false);
    
    // Show the new marker information
    $('#btn-cancel-cp').off('click');
    $('#btn-save-cp').off('click');
    $('#btn-close-cp-overlay').off('click');
    $('#btn-edit-cp').off('click');
    $('#cp-overlay').hide();
    showClickedMarker(tempMarker);
    
    // Unbind click events of tempMarker
    tempMarker.on('click', function() {
      $('#btn-cancel-cp').off('click');
      $('#btn-save-cp').off('click');
      $('#btn-close-cp-overlay').off('click');
      $('#btn-delete-cp').off('click');
      $('#btn-edit-cp').off('click');

      // showClickedMarker(this, allowEdit);
      focusMarker(tempMarker.index, true);
      scrollToCardByIndex(tempMarker.index, document.getElementById('cp-cards-container'));
      scrollToCardByIndex(tempMarker.index, document.getElementById('all-cp-cards-container'));
      scrollToCardByIndex(tempMarker.index, document.getElementById('cluster-cp-cards-container'));
    });

    // Unbind drag events of tempMarker
    tempMarker.off("dragend");
    tempMarker.on("dragend", onMarkerDragEndFactory(tempMarker));
    
    currentTempMarker = null;
  });
}

function onMarkerDragEndFactory(marker) {
  async function onMarkerDragEnd(event) {
    var position = event.target.getLatLng();
    marker.setLatLng(position);

    // Update markerDataMap
    marker.markerData['Lat_User'] = position.lat;
    marker.markerData['Long_User'] = position.lng;

    // Update the cp-overlay content with the new position
    updateCPOverlayContent(marker, marker.markerData);
    clearMapLayer(clickedMarkerLayer);
    plotMarkersOnMap([marker.markerData], "circle", clickedMarkerLayer);
  }
  return onMarkerDragEnd;
}

function onTempMarkerDragEndFactory(tempMarker) {
  async function onTempMarkerDragEnd(event) {
    var position = event.target.getLatLng();
    tempMarker.setLatLng(position);

    // Update temp marker data
    tempMarker.markerData['Lat_User'] = position.lat;
    tempMarker.markerData['Long_User'] = position.lng;

    // Update the cp-overlay content with the new position
    updateTempMarkerOverlayContent(tempMarker);
  }
  return onTempMarkerDragEnd;
}

function updateCPOverlayContent(marker, markerData=null, allowEdit=true) {
  $('#cp-route-id-display').show();
  $('#cp-route-id-select').hide();

  $('#cp-vehicle-id-display').show();
  $('#cp-vehicle-id-select').hide();

  $('#ideal-veh-type-display').show();
  $('#ideal-veh-type-select').hide();

  if (allowEdit) {
    $('#btn-edit-cp').show();
    $('#btn-delete-cp').show();
  } else {
    $('#btn-edit-cp').hide();
    $('#btn-delete-cp').hide();
  }
  
  // point = findElementById(points_data, marker.markerData['id'], 'id');
  pointData = points_data.find(point => point['id'] == marker.index);
  // Fetch Google Maps image
  setGoogleMapsImage(pointData['Lat_User'], pointData['Long_User']);

  $('#house').text(pointData['House'] !== undefined ? pointData['House'] : '');
  $('#street').text(pointData['Street'] !== undefined ? pointData['Street'] : '');
  $('#alias').text(pointData['Alias'] !== undefined ? pointData['Alias'] : '');
  $('#postal').text(pointData['Postal_Code'] !== undefined ? pointData['Postal_Code'] : '');
  $('#premises').text(pointData['Premises'] !== undefined ? pointData['Premises'] : '');
  $('#directCollection').text(pointData['Direct_Collection'] !== undefined ? pointData['Direct Collection'] : '');
  $('#idealVehType').text(pointData['Ideal_Vehicle_Type'] !== undefined ? vehicle_types_data.find(vehtype => vehtype['id'] == pointData['Ideal_Vehicle_Type'])['Name'] : '');
  $('#serviceTime').text(pointData['Service_Time_min'] !== undefined ? pointData['Service_Time_min'] : '');
  $('#vehTypeAllowed').text(pointData['Vehicle_Type_Allowed'] !== undefined ? pointData['Vehicle_Type_Allowed'] : '');
  $('#collectionWindowStart').text(pointData['Min_Collection_Time_hrs'] !== undefined ? pointData['Min_Collection_Time_hrs'] : '');
  $('#collectionWindowEnd').text(pointData['Max_Collection_Time_hrs'] !== undefined ? pointData['Max_Collection_Time_hrs'] : '');
  $('#timeCollected').text(pointData['Time_Collected_hrs'] !== undefined ? pointData['Time_Collected_hrs'] : '');
  $('#tonnage').text(pointData['Tonnage_kg'] !== undefined ? pointData['Tonnage_kg'] : '');
  $('#manpower').text(pointData['Manpower'] !== undefined ? pointData['Manpower'] : '');
  $('#remarks').text(pointData['Remarks'] !== undefined ? pointData['Remarks'] : '');
  $('#routeID').text(pointData['Route_ID'] !== undefined ? routes_data.find(route => route['id'] == pointData['Route_ID'])['Name'] : '');
  $('#vehicleID').text(pointData['Vehicle_ID'] !== undefined ? vehicles_data.find(vehicle => vehicle['id'] == pointData['Vehicle_ID'])['Name'] : '');
  $('#networkCluster').text(pointData['Network_Cluster'] !== undefined ? pointData['Network_Cluster'] : 'No Cluster');
  $('#fatigue').text(pointData['Fatigue'] !== undefined ? pointData['Fatigue'] : '');

  // if (markerData !== null) {
  //   // Fetch Google Maps image
  //   setGoogleMapsImage(markerData['Lat_User'], markerData['Long_User']);

  //   $('#house').text(markerData['House'] !== undefined ? markerData['House'] : '');
  //   $('#street').text(markerData['Street'] !== undefined ? markerData['Street'] : '');
  //   $('#alias').text(markerData['Alias'] !== undefined ? markerData['Alias'] : '');
  //   $('#postal').text(markerData['Postal_Code'] !== undefined ? markerData['Postal_Code'] : '');
  //   $('#premises').text(markerData['Premises'] !== undefined ? markerData['Premises'] : '');
  //   $('#directCollection').text(markerData['Direct_Collection'] !== undefined ? markerData['Direct Collection'] : '');
  //   $('#idealVehType').text(markerData['Ideal_Vehicle_Type'] !== undefined ? vehicle_types_data.find(vehtype => vehtype['id'] == markerData['Ideal_Vehicle_Type'])['Name'] : '');
  //   $('#serviceTime').text(markerData['Service_Time_min'] !== undefined ? markerData['Service_Time_min'] : '');
  //   $('#vehTypeAllowed').text(markerData['Vehicle_Type_Allowed'] !== undefined ? markerData['Vehicle_Type_Allowed'] : '');
  //   $('#collectionWindowStart').text(markerData['Min_Collection_Time_hrs'] !== undefined ? markerData['Min_Collection_Time_hrs'] : '');
  //   $('#collectionWindowEnd').text(markerData['Max_Collection_Time_hrs'] !== undefined ? markerData['Max_Collection_Time_hrs'] : '');
  //   $('#timeCollected').text(markerData['Time_Collected_hrs'] !== undefined ? markerData['Time_Collected_hrs'] : '');
  //   $('#tonnage').text(markerData['Tonnage_kg'] !== undefined ? markerData['Tonnage_kg'] : '');
  //   $('#manpower').text(markerData['Manpower'] !== undefined ? markerData['Manpower'] : '');
  //   $('#remarks').text(markerData['Remarks'] !== undefined ? markerData['Remarks'] : '');
  //   $('#routeID').text(markerData['Route_ID'] !== undefined ? routes_data.find(route => route['id'] == markerData['Route_ID'])['Name'] : '');
  //   $('#vehicleID').text(markerData['Vehicle_ID'] !== undefined ? vehicles_data.find(vehicle => vehicle['id'] == markerData['Vehicle_ID'])['Name'] : '');
  //   $('#networkCluster').text(markerData['Network_Cluster'] !== undefined ? markerData['Network_Cluster'] : '');
  //   $('#fatigue').text(markerData['Fatigue'] !== undefined ? markerData['Fatigue'] : '');
  // } else {
  //   // Fetch Google Maps image
  //   setGoogleMapsImage(marker.markerData['Lat_User'], marker.markerData['Long_User']);
  
  //   $('#house').text(marker.markerData['House'] !== undefined ? marker.markerData['House'] : '');
  //   $('#street').text(marker.markerData['Street'] !== undefined ? marker.markerData['Street'] : '');
  //   $('#alias').text(marker.markerData['Alias'] !== undefined ? marker.markerData['Alias'] : '');
  //   $('#postal').text(marker.markerData['Postal_Code'] !== undefined ? marker.markerData['Postal_Code'] : '');
  //   $('#premises').text(marker.markerData['Premises'] !== undefined ? marker.markerData['Premises'] : '');
  //   $('#directCollection').text(marker.markerData['Direct_Collection'] !== undefined ? marker.markerData['Direct Collection'] : '');
  //   $('#idealVehType').text(marker.markerData['Ideal_Vehicle_Type'] !== undefined ? vehicle_types_data.find(vehtype => vehtype['id'] == marker.markerData['Ideal_Vehicle_Type'])['Name'] : '');
  //   $('#serviceTime').text(marker.markerData['Service_Time_min'] !== undefined ? marker.markerData['Service_Time_min'] : '');
  //   $('#vehTypeAllowed').text(marker.markerData['Vehicle_Type_Allowed'] !== undefined ? marker.markerData['Vehicle_Type_Allowed'] : '');
  //   $('#collectionWindowStart').text(marker.markerData['Min_Collection_Time_hrs'] !== undefined ? marker.markerData['Min_Collection_Time_hrs'] : '');
  //   $('#collectionWindowEnd').text(marker.markerData['Max_Collection_Time_hrs'] !== undefined ? marker.markerData['Max_Collection_Time_hrs'] : '');
  //   $('#timeCollected').text(marker.markerData['Time_Collected_hrs'] !== undefined ? marker.markerData['Time_Collected_hrs'] : '');
  //   $('#tonnage').text(marker.markerData['Tonnage_kg'] !== undefined ? marker.markerData['Tonnage_kg'] : '');
  //   $('#manpower').text(marker.markerData['Manpower'] !== undefined ? marker.markerData['Manpower'] : '');
  //   $('#remarks').text(marker.markerData['Remarks'] !== undefined ? marker.markerData['Remarks'] : '');
  //   $('#routeID').text(marker.markerData['Route_ID'] !== undefined ? routes_data.find(route => route['id'] == marker.markerData['Route_ID'])['Name'] : '');
  //   $('#vehicleID').text(marker.markerData['Vehicle_ID'] !== undefined ? vehicles_data.find(vehicle => vehicle['id'] == marker.markerData['Vehicle_ID'])['Name'] : '');
  //   $('#networkCluster').text(marker.markerData['Network_Cluster'] !== undefined ? marker.markerData['Network_Cluster'] : '');
  //   $('#fatigue').text(marker.markerData['Fatigue'] !== undefined ? marker.markerData['Fatigue'] : '');
  // }

  if (marker.edit) {
    $('.cp-data').attr('contenteditable', true);
    $('.cp-data[contentEditable="true"]').addClass('editable');
    $('#btn-save-cp, #btn-cancel-cp').show();
    try {
      marker.dragging.enable();
    } catch (error) {
        console.error('Error enabling dragging:', error);
    }
  } else {
    resetCPOverlay();
    try {
      marker.dragging.disable();
    } catch (error) {
        console.error('Error disabling dragging:', error);
    }
  }
}

function updateTempMarkerOverlayContent(tempMarker) {
  $('#btn-edit-cp').hide();
  $('#btn-delete-cp').hide();
  
  $('.cp-data').attr('contenteditable', true);
  $('.cp-data[contentEditable="true"]').addClass('editable');
  $('#btn-save-cp, #btn-cancel-cp').show();
  tempMarker.dragging.enable();

  // Fetch Google Maps image
  setGoogleMapsImage(tempMarker.markerData['Lat_User'], tempMarker.markerData['Long_User']);

  $('#house').text(tempMarker.markerData['House'] !== undefined ? tempMarker.markerData['House'] : '');
  $('#street').text(tempMarker.markerData['Street'] !== undefined ? tempMarker.markerData['Street'] : '');
  $('#alias').text(tempMarker.markerData['Alias'] !== undefined ? tempMarker.markerData['Alias'] : '');
  $('#postal').text(tempMarker.markerData['Postal_Code'] !== undefined ? tempMarker.markerData['Postal_Code'] : '');
  $('#premises').text(tempMarker.markerData['Premises'] !== undefined ? tempMarker.markerData['Premises'] : '');
  $('#directCollection').text(tempMarker.markerData['Direct Collection'] !== undefined ? tempMarker.markerData['Direct Collection'] : '');
  $('#allowedVeh').text(tempMarker.markerData['Allowed_Veh'] !== undefined ? tempMarker.markerData['Allowed_Veh'] : '');
  $('#idealVehType').text(tempMarker.markerData['Ideal_Vehicle_Type'] !== undefined ? tempMarker.markerData['Ideal_Vehicle_Type'] : '');
  $('#serviceTime').text(tempMarker.markerData['Service_Time_min'] !== undefined ? tempMarker.markerData['Service_Time_min'] : '');
  $('#vehTypeAllowed').text(tempMarker.markerData['Vehicle_Type_Allowed'] !== undefined ? tempMarker.markerData['Vehicle_Type_Allowed'] : '');
  $('#collectionWindowStart').text(tempMarker.markerData['Min_Collection_Time_hrs'] !== undefined ? tempMarker.markerData['Min_Collection_Time_hrs'] : '');
  $('#collectionWindowEnd').text(tempMarker.markerData['Max_Collection_Time_hrs'] !== undefined ? tempMarker.markerData['Max_Collection_Time_hrs'] : '');
  $('#timeCollected').text(tempMarker.markerData['Time_Collected_hrs'] !== undefined ? tempMarker.markerData['Time_Collected_hrs'] : '');
  $('#tonnage').text(tempMarker.markerData['Tonnage_kg'] !== undefined ? tempMarker.markerData['Tonnage_kg'] : '');
  $('#manpower').text(tempMarker.markerData['Manpower'] !== undefined ? tempMarker.markerData['Manpower'] : '');
  $('#remarks').text(tempMarker.markerData['Remarks'] !== undefined ? tempMarker.markerData['Remarks'] : '');
  $('#routeID').text(tempMarker.markerData['Route_ID'] !== undefined ? tempMarker.markerData['Route_ID'] : '');
  $('#vehicleID').text(tempMarker.markerData['Vehicle_ID'] !== undefined ? vehicles_data.find(vehicle => vehicle['id'] == tempMarker.markerData['Vehicle_ID'])['Name'] : '');
  $('#networkCluster').text(tempMarker.markerData['Network_Cluster'] !== undefined ? tempMarker.markerData['Network_Cluster'] : '');
  // $('#lat').text(tempMarker.markerData['Lat_User'] !== undefined ? tempMarker.markerData['Lat_User'] : '');
  // $('#long').text(tempMarker.markerData['Long_User'] !== undefined ? tempMarker.markerData['Long_User'] : '');
  $('#fatigue').text(tempMarker.markerData['Fatigue'] !== undefined ? tempMarker.markerData['Fatigue'] : '');
}

function focusMarker(markerIndex, allowEdit=true) {
  point = findElementById(points_data, markerIndex, "id");
  lat = point['Lat_User'];
  lng = point['Long_User'];
  map.setView([lat, lng], 18);

  const marker = markers.find(marker => marker.index == markerIndex);
  showClickedMarker(marker, allowEdit);
  try {
    clearMapLayer(clickedMarkerLayer);
    var lat = marker.markerData['Lat_User']; 
    var lng = marker.markerData['Long_User'];
    var circleMarker = L.circleMarker([lat, lng], {
      radius : 10,
      color  : getColor(parseInt(point['Network_Cluster'])),
      draggable: false,
    })
    circleMarker.addTo(clickedMarkerLayer);
  } catch (error) {
    console.error("Error when clearing clickedMarkerLayer: ", error);
  }
}

function setGoogleMapsImage(lat, lng) {
  const collectionPointIframe = document.getElementById('cp-image-iframe');
  // const collectionPointImage = document.getElementById('collection-point-image');
  const googleMapsURL = `https://www.google.com/maps/embed?pb=!4v1711420735273!6m8!1m7!1ze3Bhbm9faWR9!2m2!1d${lat}!2d${lng}!3f298.33!4f-7.700000000000003!5f0.7820865974627469`;
  collectionPointIframe.src = googleMapsURL;
}


// Cluster Functions
let drawnItems;

let clusterMarkers = [];
let clusterMarkerLayer;
let clickedCPMarkerLayer;

async function createClusterMap() {
  map = L.map('map', { zoomControl: false }).setView([1.281651,103.829894], 12);
  tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);
  drawnItems = new L.FeatureGroup().addTo(map);
  clusterMarkerLayer = L.layerGroup().addTo(map);
  clickedCPMarkerLayer = L.layerGroup().addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}

function plotPolygon(coordinates) {
  drawnItems.clearLayers();

  var geoJSONData = {
    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "Polygon",
        "coordinates": [coordinates]
    }
  };

  L.geoJSON(geoJSONData).addTo(drawnItems);
  map.fitBounds(L.geoJSON(geoJSONData).getBounds());
}

function plotClusterMarkersOnMap(jsonData, icon, targetLayer) {
  // Loop through JSON data to add markers to the map
  jsonData.forEach(point => {
    var lat = point['Lat_User']; 
    var lng = point['Long_User']; 
    
    var clusterMarker;
    if (icon == "circle") {
      clusterMarker = L.circleMarker([lat, lng], {
        radius : 5,
        color  : getColor(parseInt(point['Network_Cluster'])),
        draggable: false,
      });
    } else {
      clusterMarker = L.marker([lat, lng], { 
        draggable: false,
      });
    }
    clusterMarker.addTo(targetLayer);

    clusterMarker.index = point['id'];
    clusterMarker.edit = false;
    clusterMarker.markerData = { ...point };
    clusterMarkers.push(clusterMarker);

    // Bind click event to marker to show point information
    clusterMarker.on('click', function() {
      $('#btn-close-cp-overlay').off('click');

      showClickedMarker(this, false);
      scrollToCardByIndex(this.index, document.getElementById('all-cp-cards-container'));
      scrollToCardByIndex(this.index, document.getElementById('cluster-cp-cards-container'));
    });
  });
}

function plotCPMarkersOnClusterMap(jsonData, icon, targetLayer, allowEdit=true) {
  // Loop through JSON data to add markers to the map
  jsonData.forEach(point => {
    if (!points_data.includes(point)) {
      points_data.push(point);
    }
    
    var lat = point['Lat_User']; 
    var lng = point['Long_User']; 
    
    var marker;
    if (icon == "circle") {
      marker = L.circleMarker([lat, lng], {
        radius : 5,
        color  : getColor(parseInt(point['Network_Cluster'])),
        draggable: false,
      });
    } else if (icon == "circleLarge") {
      marker = L.circleMarker([lat, lng], {
        radius : 10,
        color  : getColor(parseInt(point['Network_Cluster'])),
        draggable: false,
      });
    } else {
      marker = L.marker([lat, lng], { 
        draggable: false,
      });
    }
    marker.addTo(targetLayer);

    marker.index = point['id'];
    marker.edit = false;
    marker.markerData = { ...point };
    markers.push(marker);

    // Bind click event to marker to show point information
    marker.on('click', function() {
      $('#btn-cancel-cp').off('click');
      $('#btn-save-cp').off('click');
      $('#btn-close-cp-overlay').off('click');
      $('#btn-delete-cp').off('click');
      $('#btn-edit-cp').off('click');
      
      focusMarker(marker.index, allowEdit);
      scrollToCardByIndex(this.index, document.getElementById('cluster-cp-cards-container'));
      scrollToCardByIndex(this.index, document.getElementById('all-cp-cards-container'));
      scrollToCardByIndex(point['Network_Cluster'], document.getElementById('cluster-cards-csontainer'));
    });
  });
}

function focusCluster(clusterMidpoint) {
  map.setView([clusterMidpoint[0], clusterMidpoint[1]],15);
}

function showClickedCluster(clusterID) {
  var cluster = clusters_data.find(cluster => cluster['Cluster_ID'] == clusterID);

  // Show the cluster-overlay
  $('#cp-overlay').hide();
  $('#cluster-overlay').show();
  updateClusterOverlayContent(clusterID, false);
  
  // Bind click event to the close button to hide the cluster-overlay
  $('#btn-close-cluster-overlay').on('click', function() {
    updateClusterOverlayContent(clusterID, false);
    $('#cluster-overlay').hide();
  });
  
  // Bind click event to the cancel button
  $('#btn-cancel-cluster').on('click', function() {
    updateClusterOverlayContent(clusterID, false);
  });
  
  // Bind click event to the save button
  $('#btn-save-cluster').on('click', function() {
    cluster['Cluster_Name'] = $('#cluster-name').text();
    // cluster['Cluster_Load'] = $('#cluster-tonnage').text();
    // const newStartTime = $('#cluster-tw-start').text();
    // const newEndTime = $('#cluster-tw-end').text();
    // cluster['Cluster_TW'] = [newStartTime, newEndTime];
    // cluster['Cluster_Restrictions'] = $('#cluster-restrictions').text();
    // cluster['Cluster_Service_Time'] = $('#cluster-service-time').text();
    // cluster['Cluster_Manpower'] = $('#cluster-manpower').text();
    handleChangeClusterName(clusterID);
    updateClustersData();

    // Save data and update cluster-overlay
    updateClusterOverlayContent(clusterID, false);

    // Update Cluster Card
    updateClusterCardContent(clusterID, cluster, document.getElementById('cluster-cards-container'));
    document.getElementById('cluster-id-display').textContent = cluster.Cluster_Name;
  });

  // Bind click event to the delete button to delete the cluster
  $('#btn-delete-cluster').on('click', function() {
    $('#delete-cluster-confirmation-modal').modal('show');

    // Event listener for the confirm deletion button in the modal
    function confirmDeletion() {
      handleDeleteCluster(clusterID);
      resetClusterOverlay();
      $('#cluster-overlay').hide();
      $('#delete-cluster-confirmation-modal').modal('hide');

      // Unbind the click event to prevent multiple deletions
      document.getElementById('btn-confirm-delete-cluster').removeEventListener('click', confirmDeletion);
    }
    document.getElementById('btn-confirm-delete-cluster').addEventListener('click', confirmDeletion);
  });

  // Bind click event to the edit button to make fields editable
  $('#btn-edit-cluster').on('click', function() {
    updateClusterOverlayContent(clusterID, true);
  });
}

function showTempCluster() {
  // Show the cluster-overlay
  $('#cp-overlay').hide();
  $('#cluster-overlay').show();
  updateTempClusterOverlayContent();

  // Bind click event to the close button and cancel button to hide the cluster-overlay
  $('#btn-close-cluster-overlay, #btn-cancel-cluster').on('click', function() {
    resetClusterOverlay();
    $('#btn-cancel-cluster').off('click');
    $('#btn-save-cluster').off('click');
    $('#btn-close-cluster-overlay').off('click');
    $('#cluster-overlay').hide();
  });

  // Bind click event to the save button
  $('#btn-save-cluster').off('click').on('click', function() {
    var newCluster = {
      'Cluster_ID' : getMaxId(clusters_data, 'Cluster_ID') + 1,
      'Cluster_Name': $('#cluster-name').text(),
      'Cluster_Midpoints' : [1.281651,103.829894],
      'Cluster_Load': parseInt($('#cluster-tonnage').text()),
      'Cluster_TW': [
          parseInt($('#cluster-tw-start').text()),
          parseInt($('#cluster-tw-end').text())
      ],
      'Cluster_Restrictions': $('#cluster-restrictions').text(),
      'Cluster_Service_Time': parseInt($('#cluster-service-time').text()),
      'Cluster_Manpower': parseInt($('#cluster-manpower').text()),
      'Cluster_Points_Count' : 0
    };

    clusters_data.push(newCluster);
    updateClustersData();

    // Add Cluster Card
    setCurrentClusterID(newCluster.Cluster_ID);
    generateClusterCards([{ ...newCluster }], points_data, document.getElementById('cluster-cards-container'), document.getElementById('cluster-cards-count'), " Clusters");
    scrollToCardByIndex(newCluster.Cluster_ID, document.getElementById('cluster-cards-container'));
    document.getElementById('cluster-cards-container').querySelector(`.card[data-index="${newCluster.Cluster_ID}"]`).click();

    // Show the new cluster information
    $('#btn-cancel-cluster').off('click');
    $('#btn-save-cluster').off('click');
    $('#btn-close-cluster-overlay').off('click');
    $('#btn-edit-cluster').off('click');
    $('#cluster-overlay').hide();
    showClickedCluster(newCluster['Cluster_ID']);
  });
}

function updateClusterOverlayContent(clusterID, isEditing) {
  var cluster = clusters_data_copy.find(cluster => cluster['Cluster_ID'] == clusterID);

  $('#btn-edit-cluster').show();
  $('#btn-delete-cluster').show();

  $('#cluster-name').text(cluster['Cluster_Name'] !== undefined ? cluster['Cluster_Name'] : '');
  $('#cluster-tonnage').text(cluster['Cluster_Load'] !== undefined ? cluster['Cluster_Load'] : '');
  $('#cluster-tw-start').text(cluster['Cluster_TW'] !== undefined ? cluster['Cluster_TW'][0] : '');
  $('#cluster-tw-end').text(cluster['Cluster_TW'] !== undefined ? cluster['Cluster_TW'][1] : '');
  $('#cluster-restrictions').text(cluster['Cluster_Restrictions'] !== undefined ? cluster['Cluster_Restrictions'] : '');
  $('#cluster-service-time').text(cluster['Cluster_Service_Time'] !== undefined ? cluster['Cluster_Service_Time'] : '');
  $('#cluster-manpower').text(cluster['Cluster_Manpower'] !== undefined ? cluster['Cluster_Manpower'] : '');
  
  if (isEditing) {
    $('.cluster-data').attr('contenteditable', true);
    $('.cluster-data[contentEditable="true"]').addClass('editable');
    $('#btn-save-cluster, #btn-cancel-cluster').show();
  } else {
    resetClusterOverlay();
  }
}

function updateTempClusterOverlayContent() {
  $('#btn-edit-cluster').hide();
  $('#btn-delete-cluster').hide();
  
  $('.cluster-data').attr('contenteditable', true);
  $('.cluster-data[contentEditable="true"]').addClass('editable');
  $('#btn-save-cluster, #btn-cancel-cluster').show();

  $('#cluster-name').text('New Cluster Name');
  $('#cluster-tonnage').text('0');
  $('#cluster-tw-start').text('6');
  $('#cluster-tw-end').text('19');
  $('#cluster-restrictions').text('0');
  $('#cluster-service-time').text('0');
  $('#cluster-manpower').text('2');
}

function resetClusterOverlay() {
  $('.cluster-data').attr('contenteditable', false);
  $('.cluster-data[contentEditable="false"]').removeClass('editable');
  $('#btn-save-cluster, #btn-cancel-cluster').hide();
}

function changeClusterMarkerColour(markerID) {
  map.removeLayer(markerLayer.getLayers().find(marker => marker.index == markerID));
  plotMarkersOnMap([points_data.find(point => point['id'] == markerID)], "circle", markerLayer, false);
}



let runOptimizationMarkerLayer;
let runOptimizationCurrentMarkerLayer;
let runOptimizationRouteLayer;

// Run Optimization markers
async function createRunOptimizationMap() {
  map = L.map('map', { zoomControl: false }).setView([1.281651,103.829894], 12);
  tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);
  runOptimizationMarkerLayer = L.layerGroup().addTo(map);
  runOptimizationCurrentMarkerLayer = L.layerGroup().addTo(map);
  runOptimizationRouteLayer = L.layerGroup().addTo(map);
}

function plotRunOptimizationMarkersOnMap(pointID, icon="none", targetLayer) {
  var pointData = points_data.find(point => point['id'] == pointID);
  // Loop through JSON data to add markers to the map
  var lat = pointData['Lat_User']; 
  var lng = pointData['Long_User']; 
  
  var runOptimizationMarker
  if (icon === "circle") {
      runOptimizationMarker = L.circleMarker([lat, lng], {
      radius : 5,
      color  : getColor(parseInt(pointData['Route_ID']) * 30),
      draggable: false,
    });
  } else {
    runOptimizationMarker = L.marker([lat, lng], { 
      draggable: false,
    });
  }

  runOptimizationMarker.id = pointID;
  runOptimizationMarker.addTo(targetLayer);
  showClickedRunOPtimizationMarker(pointData);

  runOptimizationMarker.on('click', function() {
    showClickedRunOPtimizationMarker(pointData);
  });
}

function showClickedRunOPtimizationMarker(pointData) {
  // Show the cp-overlay
  $('#cluster-overlay').hide();
  $('#cp-overlay').hide();
  $('#ro-overlay').show();
  updateROCPOverlayContent(pointData);
  
   // Bind click event to the close button to hide the ro-overlay
   $('#btn-close-ro-overlay').on('click', function() {
    $('#ro-overlay').hide();
  });
}

function updateROCPOverlayContent(markerData) {
  $('#ro-house').text(markerData['House'] !== undefined ? markerData['House'] : '');
  $('#ro-street').text(markerData['Street'] !== undefined ? markerData['Street'] : '');
  $('#ro-alias').text(markerData['Alias'] !== undefined ? markerData['Alias'] : '');
  $('#ro-postal').text(markerData['Postal_Code'] !== undefined ? markerData['Postal_Code'] : '');
  $('#ro-premises').text(markerData['Premises'] !== undefined ? markerData['Premises'] : '');
  $('#ro-directCollection').text(markerData['Direct_Collection'] !== undefined ? markerData['Direct Collection'] : '');
  // $('#allowedVeh').text(point['Allowed_Veh'] !== undefined ? point['Allowed_Veh'] : '');
  $('#ro-idealVehType').text(markerData['Ideal_Vehicle_Type'] !== undefined ? vehicle_types_data.find(vehtype => vehtype['id'] == markerData['Ideal_Vehicle_Type'])['Name'] : '');
  $('#ro-serviceTime').text(markerData['Service_Time_min'] !== undefined ? markerData['Service_Time_min'] : '');
  $('#ro-vehTypeAllowed').text(markerData['Vehicle_Type_Allowed'] !== undefined ? markerData['Vehicle_Type_Allowed'] : '');
  $('#ro-collectionWindowStart').text(markerData['Min_Collection_Time_hrs'] !== undefined ? markerData['Min_Collection_Time_hrs'] : '');
  $('#ro-collectionWindowEnd').text(markerData['Max_Collection_Time_hrs'] !== undefined ? markerData['Max_Collection_Time_hrs'] : '');
  $('#ro-timeCollected').text(markerData['Time_Collected_hrs'] !== undefined ? markerData['Time_Collected_hrs'] : '');
  $('#ro-tonnage').text(markerData['Tonnage_kg'] !== undefined ? markerData['Tonnage_kg'] : '');
  $('#ro-manpower').text(markerData['Manpower'] !== undefined ? markerData['Manpower'] : '');
  $('#ro-remarks').text(markerData['Remarks'] !== undefined ? markerData['Remarks'] : '');
  $('#ro-routeID').text(markerData['Route_ID'] !== undefined ? routes_data.find(route => route['id'] == markerData['Route_ID'])['Name'] : '');
  $('#ro-vehicleID').text(markerData['Vehicle_ID'] !== undefined ? markerData['Vehicle_ID'] : '');
  $('#ro-networkCluster').text(markerData['Network_Cluster'] !== undefined ? markerData['Network_Cluster'] : '');
  $('#ro-fatigue').text(markerData['Fatigue'] !== undefined ? markerData['Fatigue'] : '');
}

function hideROCPOverlay() {
  $('#ro-overlay').hide();
}

function removeRunOptimizationMarker(pointID) {
  $('#ro-overlay').hide();
  runOptimizationMarkerLayer.eachLayer(function(marker) {
      if (marker.id == pointID) {
          runOptimizationMarkerLayer.removeLayer(marker);
      }
  });
}

function focusRoute(Route_ID) {
  clearMapLayer(runOptimizationRouteLayer);
  points_data.filter(point => point['Route_ID'] == Route_ID).forEach(point => {
    plotRunOptimizationMarkersOnMap(point['id'], "none", runOptimizationRouteLayer);
  })
}

function focusPoint(pointID) {
  clearMapLayer(runOptimizationCurrentMarkerLayer);
  plotRunOptimizationMarkersOnMap(pointID, "none", runOptimizationCurrentMarkerLayer);
}
