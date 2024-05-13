document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.map-button').forEach(button => {
        button.addEventListener('click', function() {
            scrollToElement(button.dataset.section);
        });
    });
});

function scrollToElement(elementId) {
    var element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start'});
    }
}
