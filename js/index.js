document.addEventListener("DOMContentLoaded", function() {
    // Display loading screen
    // showLoadingScreen();
    hideLoadingScreen();
    loadBlockContent('home_page.html');

    // Hide loading screen when page is fully loaded
    window.addEventListener("load", hideLoadingScreen);
});

function showLoadingScreen() {
    $('#loading-screen').show();
}

function hideLoadingScreen() {
    $('#loading-screen').hide();
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

function handleRouting() {
    // Get the current path from the URL
    const path = window.location.pathname;

    // Check the path and load content accordingly
    if (path === '/simple_optimization') {
        loadBlockContent('simple_optimization.html');
    } else if (path === '/free_optimization') {
        loadBlockContent('free_optimization.html');
    } else if (path === '/edit_fleet') {
        loadBlockContent('edit_fleet.html');
    } else if (path === '/edit_locations') {
        loadBlockContent('edit_locations.html');
    } else if (path === '/edit_clusters') {
        loadBlockContent('edit_clusters.html');
    } else if (path === '/guide') {
        loadBlockContent('guide.html');
    } else {
        loadBlockContent('index.html');
    }
}

function loadBlockContent(htmlFile) {
    fetch(htmlFile)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            // Render the HTML content into a container element
            document.getElementById('block-content').innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching HTML content:', error);
        });
}

function updateDepotsData() {
    console.log("Changed to dummy function call to facilitate hosting on Github Pages. No action taken.");
}

function updateVehicleTypesData() {
    console.log("Changed to dummy function call to facilitate hosting on Github Pages. No action taken.");
}

function updateRoutesData() {
    console.log("Changed to dummy function call to facilitate hosting on Github Pages. No action taken.");
}

function updateVehiclesData() {
    console.log("Changed to dummy function call to facilitate hosting on Github Pages. No action taken.");
}

function updatePointsData() {
    console.log("Changed to dummy function call to facilitate hosting on Github Pages. No action taken.");
}

function updateClustersData() {
    console.log("Changed to dummy function call to facilitate hosting on Github Pages. No action taken.");
}
