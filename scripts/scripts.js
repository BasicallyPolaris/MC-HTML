const inputImage = $("#file-upload");
const puzzle = $("#puzzle");
inputImage.on("change", handleUpload);

$("#generate-btn").on("click", generatePuzzlePieces);
$("#tileOptions").on("change", function () {
    if ($(".puzzle-tile").length !== 0) {
        $("#generate-btn").removeClass("disabled");
    }
    console.log("schwanz");
})

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const draggedElementId = event.dataTransfer.getData("text");
    const draggedElement = $("#" + draggedElementId);
    const droppedElement = $("#" + event.target.id);

    // Swap the ID and src
    const draggedId = draggedElement.attr("id");
    const draggedSrc = draggedElement.attr("src");

    draggedElement.attr("id", droppedElement.attr("id"));
    draggedElement.attr("src", droppedElement.attr("src"))

    droppedElement.attr("id", draggedId);
    droppedElement.attr("src", draggedSrc);
}

// Handles the upload of an image
function handleUpload() {
    const inputImageURL = URL.createObjectURL(inputImage.prop("files")[0]);
    puzzle.attr("src", inputImageURL);
    puzzle.removeClass("d-none");
    $("#generate-btn").removeClass("disabled");
    $("#features").slideUp();
    $("#hero").children().first().addClass("mb-0");
    $(".puzzle-tile").remove();
}

// TODO: If its a border piece, draw a border + then add according width and height to the elements and the div holding the images up top
function generatePuzzlePieces() {
    $(".puzzle-tile").remove();
    $("#generate-btn").addClass("disabled");

    const tileAmount = $("#tileOptions").find(":selected").val();
    const tileAxis = Math.ceil(Math.sqrt(tileAmount));
    const originalImage = puzzle[0];
    const tileStorage = $("#tile-storage");

    // delta values for the actual image cropping
    const deltaX = Math.ceil(originalImage.naturalWidth / tileAxis);
    const deltaY = Math.ceil(originalImage.naturalHeight / tileAxis);

    // delta values for the displayed images (need to do some rounding)
    const imageXDelta = Math.ceil(puzzle.width() / tileAxis);
    const imageYDelta = Math.ceil(puzzle.height() / tileAxis);

    tileStorage.css("width", (imageXDelta * tileAxis + 24) + "px");
    tileStorage.css("height", (imageYDelta * tileAxis + 24) + "px");

    const puzzlePattern = getRandomIndizies2d(tileAxis);


    puzzlePattern.forEach(function (coordinate) {
        const offsetX = coordinate[0];
        const offsetY = coordinate[1];

        var canvas = document.createElement("canvas");
        canvas.width = deltaX;
        canvas.height = deltaY;
        canvas.getContext("2d").drawImage(originalImage, offsetX * deltaX, offsetY * deltaY, deltaX, deltaY, 0, 0, deltaX, deltaY);

        var tile = new Image();
        tile.src = canvas.toDataURL();
        // Set id and class and attribute for logic and looks
        tile.setAttribute("id", "tile-" + offsetX + "-" + offsetY);
        tile.setAttribute("class", "puzzle-tile");
        tile.setAttribute("coordinate", "tile-" + offsetX + "-" + offsetY);

        // Add event listeners for drag and drop
        tile.addEventListener('dragstart', drag);
        tile.addEventListener('dragover', allowDrop);
        tile.addEventListener('drop', drop);
        tileStorage[0].append(tile);
        $("#tile-" + offsetX + "-" + offsetY).css("width", imageXDelta + "px");
        $("#tile-" + offsetX + "-" + offsetY).css("height", imageYDelta + "px");
    })
}

// Returns an array that hold 2d tuples for an set square axis length
function getRandomIndizies2d(axisLength) {
    const indizies = [];
    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            indizies.push([i, j]);
        }
    }

    shuffleArray(indizies);
    return indizies;
}

// Implementation of Durstenfeld shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}