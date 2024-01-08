insertFooter();

/**
 * @func insertFooter
 * @description 'Insers the footer at the bottom of the page html'
 */
function insertFooter() {
    $("#content").after("<div id='footer-placeholder'></div>");
    $.get("footer.html", function(data) {
        $("#footer-placeholder").replaceWith(data); 
    })
}