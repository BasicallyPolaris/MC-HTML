/* Used to insert the navbar at the top of a page */
function insertNavbar() {
    placeholder = '<div id="navbar-placeholder"></div>'
    document.body.insertAdjacentHTML('afterbegin', placeholder); 
    $("#navbar-placeholder").load("nav.html"); 
}