insertNavbar();

/**
 * @func insertNavbar
 * @description 'Inserts the navbar at the top of the page and checks for prefered darkmode'
 */
function insertNavbar() {
    if (window.location && !window.location.protocol.toString().includes("http")) {
        alert("Please open the index.html via http/https to allow XMLHttpRequests for the navbar and footer to be imported via script.");
    }
    $("#content").prepend("<div id='navbar-placeholder'></div>");
    $.get("nav.html", function (data) {
        $("#navbar-placeholder").replaceWith(data);

        // 'Listener used for the dark mode toggle'
        $("#dark-mode-toggle").on("click", toggleDarkMode);
        detectDarkMode();
    });
}

/**
 * @func detectDarkMode
 * @description 'Detects whether the user prefers dark mode and if so set's it'
 */
function detectDarkMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        toggleDarkMode();
    }
}

/**
 * @func toggleDarkMode
 * @description 'Used to toggle the dark mode on the website'
 */
function toggleDarkMode() {
    const toggleButton = $("#dark-mode-toggle");

    // Currently in light mode
    if ($("html").attr("data-bs-theme") === "light") {
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