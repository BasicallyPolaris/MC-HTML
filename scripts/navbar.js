insertNavbar();

/* Used to insert the navbar at the top of a page */
function insertNavbar() {
    $("body").prepend("<div id='navbar-placeholder'></div>");
    $("#navbar-placeholder").load("nav.html"); 
}