function hideLoadingScreen() {
    $('.loading-screen').hide(); // Use jQuery to hide loading screen
}

$(document).ready(function() {
    // Set the page name on page load
    window.onload = setPageName;
    
    $('#btn-toggle-sidebar').click(function() {
        $('#sidebar').toggleClass('sidebar-hidden');
    });

    $('#page-content').click(function() {
        $('#sidebar').addClass('sidebar-hidden');
    });
});

// Hide the loading screen when absolutely everything is loaded
$(window).on('load', hideLoadingScreen);

function setPageName() {
    // Get the current page URL
    const currentPageURL = window.location.pathname;

    // Extract the page name from the URL
    let pageName;
    switch (currentPageURL) {
        case '/':
            pageName = 'RouteOS';
            break;
        case '/guide':
            pageName = 'Guide';
            break;
        case '/simple_optimization':
            pageName = 'Simple Optimization';
            break;
        case '/free_optimization':
            pageName = 'Free Optimization';
            break;
        case '/edit_optimization':
            pageName = 'Review Optimization';
            break;
        case '/edit_fleet':
            pageName = 'Edit Fleet';
            break;
        case '/edit_locations':
            pageName = 'Edit Locations';
            break;
        case '/edit_clusters':
            pageName = 'Edit Clusters';
            break;
        default:
            pageName = 'RouteOS';
    }

    // Set the page name as the content of the navbar brand
    document.getElementById('page-name').textContent = pageName;
}

function updateDepotsData() {
    fetch('/update_depots', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(depots_data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
    })
    .catch(error => {
        console.error('Error updating depots:', error);
    });
}

function updateVehicleTypesData() {
    fetch('/update_vehicle_types', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vehicle_types_data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
    })
    .catch(error => {
        console.error('Error updating vehicle types:', error);
    });
}

function updateRoutesData() {
    fetch('/update_routes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(routes_data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
    })
    .catch(error => {
        console.error('Error updating routes:', error);
    });
}

function updateVehiclesData() {
    fetch('/update_vehicles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vehicles_data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
    })
    .catch(error => {
        console.error('Error updating vehicles:', error);
    });
}

function updatePointsData() {
    fetch('/update_points', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(points_data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
        // if (callback) {
        //     callback();
        // }
    })
    .catch(error => {
        console.error('Error updating points:', error);
    });
}

function updateClustersData() {
    fetch('/update_clusters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(clusters_data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); 
    })
    .catch(error => {
        console.error('Error updating clusters:', error);
    });
}
