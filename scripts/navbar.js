insertNavbar();

/* Used to insert the navbar at the top of a page */
function insertNavbar() {
    $("#content").prepend("<div id='navbar-placeholder'></div>");
    $.get("nav.html", function(data) {
        $("#navbar-placeholder").replaceWith(data); 
    })
}