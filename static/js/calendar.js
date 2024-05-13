// Ensure valid date selections
document.addEventListener('DOMContentLoaded', function() {
    const fromDateInput = document.getElementById('input-geotab-from-date');
    const toDateInput = document.getElementById('input-geotab-to-date');

    // Add event listener to from date input
    fromDateInput.addEventListener('change', function() {
        // Set minimum value for to date input to be the selected from date
        toDateInput.min = fromDateInput.value;
        // If toDateInput is empty, set it to the selected from date
        if (!toDateInput.value) {
            toDateInput.value = fromDateInput.value;
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const fromDateInput = document.getElementById('input-geotab-from-date');
    const toDateInput = document.getElementById('input-geotab-to-date');

    // Add event listener to to date input
    toDateInput.addEventListener('change', function() {
        // Set maximum value for from date input to be the selected to date
        fromDateInput.max = toDateInput.value;
        // If fromDateInput is empty, set it to the selected to date
        if (!fromDateInput.value) {
            fromDateInput.value = toDateInput.value;
        }
    });
});

function resetCalendarInputs() {
    // Reset vehicle ID input
    document.getElementById("input-geotab-vehicle-id").value = "";
    
    // Reset from date input
    document.getElementById("input-geotab-from-date").value = "";
    
    // Reset to date input
    document.getElementById("input-geotab-to-date").value = "";
}