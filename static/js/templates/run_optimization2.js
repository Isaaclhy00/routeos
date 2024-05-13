let pointsToAssignSet = new Set();
let vehiclesInvolvedSet = new Set();
let routesInvolvedSet = new Set();

function toggleCardVisibility(elementid) {
    var CardContainer = document.getElementById(elementid);
    if (CardContainer.style.display === 'none') {
        CardContainer.style.display = 'block';
    } else {
        CardContainer.style.display = 'none';
    }
}

