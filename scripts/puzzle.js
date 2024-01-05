// TODO: FIX DRAGGABLE MOUSE ?
const colorThief = new ColorThief();
const inputImage = $("#file-upload");
const puzzle = $("#puzzle-image");
const timer = $("#timer");
var drawBorder = true;
var drawTimer = true;

var timeStarted;
var timerInterval;

inputImage.on("change", handleUpload);

$("#generate-border-switch").on("click", function () {
    drawBorder = !drawBorder;
});
$("#display-timer-switch").on("click", function () {
    drawTimer = !drawTimer;
    console.log(drawTimer);
});
$("#generate-btn").on("click", generatePuzzlePieces);

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

    // If the dropped on image is not draggable, then dont allow swapping
    if (droppedElement.attr("draggable") === "false") {
        return;
    }

    const droppedContainer = droppedElement.parent();
    const draggedContainer = draggedElement.parent();

    // Swap the coordinates and then the elemntes in html

    draggedContainer.append(droppedElement);
    droppedContainer.append(draggedElement);    

    checkTilePosition(droppedElement[0]);
    checkTilePosition(draggedElement[0]);
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
    $(".tile-placeholder").remove();

    const tileAmount = $("#tileOptions").find(":selected").val();
    const axisLength = Math.ceil(Math.sqrt(tileAmount));
    const originalImage = puzzle[0];
    const tileStorage = $("#tile-storage");

    // delta values for the actual image cropping
    const deltaX = Math.ceil(originalImage.naturalWidth / axisLength);
    const deltaY = Math.ceil(originalImage.naturalHeight / axisLength);

    // delta values for the displayed images (need to do some rounding)
    const imageXDelta = Math.ceil(puzzle.width() / axisLength);
    const imageYDelta = Math.ceil(puzzle.height() / axisLength);

    tileStorage.css("width", (imageXDelta * axisLength + 24) + "px");
    tileStorage.css("height", (imageYDelta * axisLength + 24) + "px");

    const puzzlePattern = getRandomIndizies2d(axisLength);
    const borderColor = colorThief.getColor(originalImage);

    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            const offsetX = puzzlePattern[i * axisLength + j][0];
            const offsetY = puzzlePattern[i * axisLength + j][1];

            const tile = drawPuzzleTile(deltaX, deltaY, offsetX, offsetY, originalImage, axisLength, borderColor);

            // Setup the div containing the tile with its coordinate
            const div = document.createElement("div");

            div.classList.add("d-inline-block");
            div.classList.add("tile-placeholder")
            div.setAttribute("id", "divtile-" + i + "-" + j);
            div.setAttribute("coordinate", "tile-" + i + "-" + j);
            div.style.width = imageXDelta + "px";
            div.style.height = imageYDelta + "px";
            div.append(tile);

            // Set id and class and attribute for logic and looks
            tile.setAttribute("id", "tile-" + offsetY + "-" + offsetX);
            tile.setAttribute("class", "puzzle-tile");
            tile.setAttribute("draggable", true);

            // Check whether tile was randomly placed in the right position
            if (offsetX === j && offsetY === i) {
                tile.setAttribute("draggable", false);
                tile.setAttribute("landed", true);
            }

            // Add event listeners for drag and drop
            tile.addEventListener('dragstart', drag);
            tile.addEventListener('dragover', allowDrop);
            tile.addEventListener('drop', drop);
            tileStorage[0].append(div);
            $("#tile-" + offsetY + "-" + offsetX).css("width", imageXDelta + "px");
            $("#tile-" + offsetY + "-" + offsetX).css("height", imageYDelta + "px");
        }
    }

    startTimer();
}

// Returns an array that hold 2d tuples for an set square axis length
function getRandomIndizies2d(axisLength) {
    const indizies = [];
    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            indizies.push([j, i]);
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

// Checks whether the current tile is in the right spot, if so remove the draggable property
function checkTilePosition(tile) {
    if (tile.parentNode.getAttribute("coordinate") === tile.getAttribute("id")) {
        tile.setAttribute("draggable", false);
        tile.setAttribute("landed", true);
        setInterval(function () {
            tile.removeAttribute("landed");
        }, 500);
    }
}

// Draw a puzzle tile using the 
function drawPuzzleTile(width, height, offsetX, offsetY, originalImage, tileAxis, borderColor) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    canvasCtx = canvas.getContext("2d");
    canvasCtx.drawImage(originalImage, offsetX * width, offsetY * height, width, height, 0, 0, width, height);

    if (drawBorder) {
        drawTileBorder(offsetX, offsetY, width, height, tileAxis, canvasCtx, borderColor);
    }

    // var tile = new Image();
    // tile.src = canvas.toDataURL();

    // return tile;
    return canvas;
}

// Draws the borders of an image onto the image, dependent on the image position
function drawTileBorder(xCoord, yCoord, width, height, axisLength, context, rgbColor) {
    // context.strokeStyle = "rgb(" + rgbColor.r + ", " + rgbColor.g + ", " + rgbColor.b + ")";
    context.strokeStyle = "rgb(" + rgbColor[0] + ", " + rgbColor[1] + ", " + rgbColor[2] + ")";
    context.lineWidth = Math.ceil(width * 0.10);
    context.beginPath();

    if (xCoord === 0) {
        context.moveTo(0, 0);
        context.lineTo(0, height);
        context.stroke();
    }

    if (xCoord === axisLength - 1) {
        context.moveTo(width, 0);
        context.lineTo(width, height);
        context.stroke();
    }

    if (yCoord === 0) {
        context.moveTo(0, 0);
        context.lineTo(width, 0);
        context.stroke();
    }

    if (yCoord === axisLength - 1) {
        context.moveTo(0, height);
        context.lineTo(width, height);
        context.stroke();
    }
}

function startTimer() {
    if (timeStarted != Date.now()) {
        timeStarted = Date.now();
        clearInterval(timerInterval);
    }

    if (drawTimer) {
        timer.parent().removeClass("d-none");
        timerInterval = setInterval(countUp, 1000);
    }
}

function countUp() {
    const deltaTime = Date.now() - timeStarted;
    const minutes = Math.floor(deltaTime / 1000 / 60);
    const seconds = Math.floor(deltaTime / 1000 % 60);

    const minuteString = minutes < 10 ? "0" + minutes : minutes;
    const secondsString = seconds < 10 ? "0" + seconds : seconds;

    timer.text(minuteString + ":" + secondsString);
}