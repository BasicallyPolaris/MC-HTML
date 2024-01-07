insertNavbar();

/* Used to insert the navbar at the top of a page */
function insertNavbar() {
    $("#content").prepend("<div id='navbar-placeholder'></div>");
    $.get("nav.html", function (data) {
        $("#navbar-placeholder").replaceWith(data);

        // 'Listener used for the dark mode toggle'
        $("#dark-mode-toggle").on("click", toggleDarkMode);
    })

}

/**
 * @func toggleDarkMode
 * @description 'Used to toggle the dark mode on the website'
 */
function toggleDarkMode() {
    const toggleButton = $("#dark-mode-toggle");

    // Currently in light mode
    if (toggleButton.hasClass("btn-light")) {
        // Change button in navbar
        toggleButton.removeClass("btn-light");
        toggleButton.addClass("btn-dark");
        toggleButton.children("span").text("dark_mode");
        // Set bootstrap html for dark-theme
        $("html").attr("data-bs-theme", "dark");
        $(".icon-square").addClass("icon-square-dark");
        // Change navbar and footer icon to fit dark/light mode
        $("nav img").attr("src", "./images/Octicons-puzzle-darkmode.svg");
        $("footer img").attr("src", "./images/Octicons-puzzle-footer-darkmode.svg");
    } else {
        // Set bootstrap html for dark theme
        toggleButton.removeClass("btn-dark");
        toggleButton.addClass("btn-light");
        toggleButton.children("span").text("light_mode");
        // Set bootstrap html for light-theme
        $("html").attr("data-bs-theme", "light");
        $(".icon-square").removeClass("icon-square-dark");
        // Change navbar and footer icon to fit dark/light mode
        $("nav img").attr("src", "./images/Octicons-puzzle-lightmode.svg");
        $("footer img").attr("src", "./images/Octicons-puzzle-lightmode.svg");
    }
}