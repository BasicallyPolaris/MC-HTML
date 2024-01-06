// Variables used for the puzzle tiles
const colorThief = new ColorThief();
const inputFile = $("#file-upload");
const puzzle = $("#puzzle-image");
const timer = $("#timer");
var drawBorder = true;
var drawTimer = true;

// Variables used for the Timer
var timeStarted;
var timerInterval;

// Variables used for the video puzzle
var videoWidth = 0;
var videoHeight = 0;
var video = document.createElement('video');
var videoTrack;
const frameMS = 50;
var timerIntervals = [];
var axisLength = 0;

// Stores the actual file that was uploaded most recently
var file;

// Set eventlisteners for all buttons & for upload handle
inputFile.on("change", handleUpload);

window.addEventListener("resize", resizeTiles);

$("#generate-border-switch").on("click", function () {
    drawBorder = !drawBorder;
});

$("#display-timer-switch").on("click", function () {
    drawTimer = !drawTimer;
});

$("#generate-btn").on("click", function () {
    // Define the axis length
    const tileAmount = $("#tileOptions").find(":selected").val();
    axisLength = Math.ceil(Math.sqrt(tileAmount));
    if (videoTrack || file.type == "video/mp4") {
        drawVideoPuzzlePieces(video);
    } else {
        generatePuzzlePieces(puzzle[0]);
    }
});

$("#webcam-btn").on("click", function () {
    if (videoTrack) {
        if (videoTrack.stop) { videoTrack.stop(); }
        videoTrack = null;
        resetVideo();
    } else {
        initializeWebcam();
    }
});

$("#webcam-video").parent().on("click", function () {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
});

// Drag and Drop API
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

    // Swap the coordinates and then the elementes in html
    draggedContainer.append(droppedElement);
    droppedContainer.append(draggedElement);

    checkTilePosition(droppedElement[0]);
    checkTilePosition(draggedElement[0]);
}


/// Starts the timer for the puzzle
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

/// Used to count up the timer
function countUp() {
    const deltaTime = Date.now() - timeStarted;
    const minutes = Math.floor(deltaTime / 1000 / 60);
    const seconds = Math.floor(deltaTime / 1000 % 60);

    const minuteString = minutes < 10 ? "0" + minutes : minutes;
    const secondsString = seconds < 10 ? "0" + seconds : seconds;

    timer.text(minuteString + ":" + secondsString);
}

// Handles the upload of an image
function handleUpload() {
    // Check whether the upload actually happened, if not just return
    if (inputFile.prop("files").length == 0) {
        return;
    }
    file = inputFile.prop("files")[0];
    const inputURL = URL.createObjectURL(file);
    resetVideo();
    resetPuzzle();
    if (file.type.match("video/*")) {
        // If its a video, display and play it muted, allow to pause it
        video.src = inputURL;
        video.muted = true;
        video.classList.add("container");
        video.setAttribute("id", "webcam-video");
        video.setAttribute("autoplay", true);
        video.setAttribute("alt", "video-stream");
        video.setAttribute("loop", true);
        video.addEventListener('loadedmetadata', function () {
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            $("#webcam-video").parent().removeClass("d-none");
            $("#webcam-video").replaceWith(video);
            $("#generate-btn").removeClass("disabled");
        });
    } else if (file.type.match("image/*")) {
        puzzle.attr("src", inputURL);
        puzzle.removeClass("d-none");
    }
    $("#generate-btn").removeClass("disabled");
}

// Generates the puzzle pieces for a given input image DOM
function generatePuzzlePieces(originalImage) {
    /// Make sure all previous puzzle pieces and intervals are cleansed
    $(".tile-placeholder").remove();
    timerIntervals.forEach(function (interval) {
        clearInterval(interval);
    });
    timerIntervals = [];

    // get the tile storage
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

            const tileCanvas = document.createElement("canvas");
            const tile = drawPuzzleTile(tileCanvas, deltaX, deltaY, offsetX, offsetY, originalImage, axisLength, borderColor);

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

// Checks whether the current tile is in the right spot, if so remove the draggable property and play an animation
function checkTilePosition(tile) {
    if (tile.parentNode.getAttribute("coordinate") === tile.getAttribute("id")) {
        tile.setAttribute("draggable", false);
        tile.setAttribute("landed", true);
        setInterval(function () {
            tile.removeAttribute("landed");
        }, 500);
    }
}

// Draw an image / video to a puzzle tile canvas using the offset and width and height
function drawPuzzleTile(canvas, width, height, offsetX, offsetY, originalImage, tileAxis, borderColor) {
    canvas.width = width;
    canvas.height = height;

    canvasCtx = canvas.getContext("2d");
    canvasCtx.drawImage(originalImage, offsetX * width, offsetY * height, width, height, 0, 0, width, height);

    if (drawBorder) {
        drawTileBorder(offsetX, offsetY, width, height, tileAxis, canvasCtx, borderColor);
    }

    return canvas;
}

// Draws the borders of an image onto the image, dependent on the image position
function drawTileBorder(xCoord, yCoord, width, height, axisLength, context, rgbColor) {
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

/// Tries to get a webcam with hd quality, if not tries to get one with vga constraints or stops.
function initializeWebcam() {
    resetVideo();
    const videoSource = videoSelect.value;
    const hdConstraints = {
        video: {
            deviceId: videoSource ? { exact: videoSource } : undefined,
            width: 1280,
            height: 720,
        }
    }

    const vgaConstraints = {
        video: {
            deviceId: videoSource ? { exact: videoSource } : undefined,
            width: 640,
            height: 480,
        }
    }

    navigator.getUserMedia(hdConstraints, function (stream) {
        video.srcObject = stream;
        videoTrack = stream.getTracks()[0];
        resetPuzzle();
        setUpVideo();
    }, function (e) {
        if (videoTrack) {
            videoTrack.stop();
        }
        navigator.getUserMedia(vgaConstraints, function (stream) {
            video.srcObject = stream;
            videoTrack = stream.getTracks()[0];
            resetPuzzle();
            setUpVideo();
        }, function (e) {
            if (videoTrack) {
                videoTrack.stop();
            }
            alert("Sorry, your webcam isn't supported or is unavailable.")
        });
    });
}

// Sets up the video preview for your camera / video
function setUpVideo() {
    video.setAttribute("id", "webcam-video");
    video.setAttribute("autoplay", true);
    video.setAttribute("alt", "video-stream");
    video.classList.add("container");
    video.addEventListener('loadedmetadata', function () {
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
        $("#webcam-video").parent().removeClass("d-none");
        $("#webcam-video").replaceWith(video);
        $("#generate-btn").removeClass("disabled");
    });
}

// Draws the puzzle pieces from the video
function drawVideoPuzzlePieces(video) {
    /// Make sure all previous puzzle pieces and intervals are cleansed
    $(".tile-placeholder").remove();
    timerIntervals.forEach(function (interval) {
        clearInterval(interval);
    });
    timerIntervals = [];

    // get the tile storage
    const tileStorage = $("#tile-storage");

    // delta values for the actual image cropping
    const deltaX = Math.ceil(videoWidth / axisLength);
    const deltaY = Math.ceil(videoHeight / axisLength);

    // delta values for the displayed images (need to do some rounding)
    const proportion = videoHeight / videoWidth;
    const imageXDelta = Math.floor($("#webcam-video").width() / axisLength);
    const imageYDelta = Math.floor($("#webcam-video").width() * proportion / axisLength);

    // border color for the border
    const borderColor = "black";

    // Puzzle pattern for the randomly assigned puzzle pieces
    const puzzlePattern = getRandomIndizies2d(axisLength);

    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            const offsetX = puzzlePattern[i * axisLength + j][0];
            const offsetY = puzzlePattern[i * axisLength + j][1];

            const tileCanvas = document.createElement("canvas");
            const tile = drawPuzzleTile(tileCanvas, deltaX, deltaY, offsetX, offsetY, video, axisLength, borderColor);

            timerIntervals.push(setInterval(function () {
                refreshTile(tile, deltaX, deltaY, offsetX, offsetY, video, axisLength, borderColor);
            }, frameMS));

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
            tile.setAttribute("offsetX", offsetX);
            tile.setAttribute("offsetY", offsetY);

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

/// Used to resize all puzzle tiles
function resizeTiles() {
    const isVideo = !$("#webcam-video").parent().hasClass("d-none")
    const isImage = !$("#puzzle-image").hasClass("d-none");
    var imageXDelta = 0;
    var imageYDelta = 0;
    var tileStorageWidth = 0;
    var tileStorageHeight = 0;

    if (isVideo) {
        imageXDelta = Math.floor($("#webcam-video").width() / axisLength);
        imageYDelta = Math.floor($("#webcam-video").height() / axisLength);
        tileStorageWidth = $("#webcam-video").width();
        tileStorageHeight = $("#webcam-video").height();
    } else if (isImage) {
        imageXDelta = Math.floor($("#puzzle-image").width() / axisLength);
        imageYDelta = Math.floor($("#puzzle-image").height() / axisLength);
        tileStorageWidth = $("#puzzle-image").width();
        tileStorageHeight = $("#puzzle-image").height();
    }

    if (isVideo || isImage) {
        $(".puzzle-tile").css("width", imageXDelta + "px");
        $(".puzzle-tile").css("height", imageYDelta + "px");
        $(".puzzle-tile").parent().css("width", imageXDelta + "px");
        $(".puzzle-tile").parent().css("height", imageYDelta + "px");
        $("#tile-storage").css("width", (tileStorageWidth + 24) + "px");
        $("#tile-storage").css("height", (tileStorageHeight + 24) + "px");
    }
}

// Function used to redraw a tile from a video source
function refreshTile(tileCanvas, deltaX, deltaY, offsetX, offsetY, video, axisLength, borderColor) {
    tileCanvas.getContext("2d").save();
    drawPuzzleTile(tileCanvas, deltaX, deltaY, offsetX, offsetY, video, axisLength, borderColor);
    tileCanvas.getContext("2d").restore();
}

// Resets the UI & Puzzle from an Image
function resetPuzzle() {
    puzzle.addClass("d-none");
    $("#tile-storage").removeAttr("style");
    $("#tile-storage").removeClass("d-none");
    $(".tile-placeholder").remove();
    $("#generate-btn").addClass("disabled");
    timer.parent().addClass("d-none");
    clearInterval(timerInterval);
}

// Resets the UI from the video and all puzzle pieces
function resetVideo() {
    if (videoTrack) {
        if (videoTrack.stop) { videoTrack.stop(); }
        videoTrack = null;
    }
    if (video.src) {
        video = document.createElement("video");
    }
    $("#webcam-video").parent().addClass("d-none");
    $("#tile-storage").removeAttr("style");
    $("#tile-storage").removeClass("d-none");
    $("#generate-btn").addClass("disabled");
    $(".tile-placeholder").remove();
    timerIntervals.forEach(function (interval) {
        clearInterval(interval);
    });
    timerIntervals = [];
    timer.parent().addClass("d-none");
    clearInterval(timerInterval);
}

// Get the right webcam
const videoSelect = $("#webcam-select")[0];

// Sets all video devices with their right value in the settings pannel
function getVideoDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    while (videoSelect.firstChild) {
        videoSelect.removeChild(videoSelect.firstChild);
    }
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

// Get all devices for camerra
navigator.mediaDevices.enumerateDevices().then(getVideoDevices);

// Set a listener to change webcam source on the fly if selector changes
videoSelect.onchange = function () {
    initializeWebcam();
}
