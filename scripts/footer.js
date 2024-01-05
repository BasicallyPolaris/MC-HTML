insertFooter();

/* Used to insert the footer at the end of a page */
function insertFooter() {
    $(".content").after("<div id='footer-placeholder'></div>");
    $.get("footer.html", function(data) {
        $("#footer-placeholder").replaceWith(data); 
    })
}