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
var rightPieces = 0;

// Variables used for the video puzzle
var videoWidth = 0;
var videoHeight = 0;
var video = document.createElement('video');
var videoTrack;
const frameMS = 50;
var timerIntervals = [];
var axisLength = 0;
// Color of the tertiary background from bootstrap in light-mode
const lightModeBorderColor = [233, 236, 239];
// Color of the tertiary background from bootstrap in dark-mode
const darkModeBorderColor = [52, 58, 64];

// Webcam-Source selectors
const webcamSelect = $("#webcam-select")[0];
const videoSource = webcamSelect.value;

// Stores the actual file that was uploaded most recently
var file;

// Enumerate devices if you already have the permission for them
navigator.mediaDevices.enumerateDevices().then(getVideoDevices);

/**
 * @description 'Listener to handle the file upload via button'
 */
inputFile.on("change", handleUpload);

/**
 * @description 'Listener used to dynamically resize all tiles with a window resize'
 */
window.addEventListener("resize", resizeTiles);

/**
 * @description 'Listener used to dynamically change whether the borders are shown on the puzzle tiles by configuring it in the settings tab'
 */
$("#generate-border-switch").on("click", function () {
    drawBorder = !drawBorder;

    // If no puzzle is drawn so far, no need to refresh it
    if ($(".puzzle-tile").length === 0) {
        return;
    }

    // Refresh the puzzle tiles
    const isVideo = !$("#video-stream").parent().hasClass("d-none")
    const isImage = !$("#puzzle-image").hasClass("d-none");
    var deltaX = 0;
    var deltaY = 0;
    var source;
    var borderColor = isDarkMode() ? darkModeBorderColor : lightModeBorderColor;

    if (isVideo) {
        source = video;
        deltaX = Math.floor(videoWidth / axisLength);
        deltaY = Math.floor(videoHeight / axisLength);
    } else if (isImage) {
        source = puzzle[0];
        deltaX = Math.floor(source.naturalWidth / axisLength);
        deltaY = Math.floor(source.naturalHeight / axisLength);
        borderColor = colorThief.getColor(source);
    }


    $(".puzzle-tile").each(function () {
        const tileIdSplit = $(this).attr("id").split("-");
        const offsetX = tileIdSplit[2];
        const offsetY = tileIdSplit[1];
        refreshTile($(this)[0], deltaX, deltaY, offsetX, offsetY, source, axisLength, borderColor);
    });
});

/**
 * @description 'Listener used to dynamically show or hide the timer by configuring it in the settings tab'
 */
$("#display-timer-switch").on("click", function () {
    drawTimer = !drawTimer;
    if (!timerInterval || !drawTimer) {
        timer.parent().addClass("d-none");
    } else {
        timer.parent().removeClass("d-none")
    }
});

/**
 * @description 'Listener to generate the puzzle pieces for a given input video or image'
 */
$("#generate-btn").on("click", function () {
    // Define the axis length
    const tileAmount = $("#tileOptions").find(":selected").val();
    axisLength = Math.floor(Math.sqrt(tileAmount));
    rightPieces = 0;
    if (videoTrack || file.type == "video/mp4") {
        generateVideoPuzzlePieces(video);
    } else {
        generatePuzzlePieces(puzzle[0]);
    }
});

/**
 * @description 'Listener for the webcam button, changes its appereance dynamically and stops or starts webcam tracking'
 */
$("#webcam-btn").on("click", toggleWebcam);

/**
 * @description 'Listener to allow for the video stream to be started and paused by clicking on it'
 */
$("#video-stream").parent().on("click", function () {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
});

/**
 * @func allowDrop
 * @description 'Implements the allowdrop functionality for the drag&drop-api'
 * @param event 'drag&drop-api event'
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * @func drag
 * @description 'Implements the functionality the drag functionality for drag & drop api of puzzle pieces, sets the data of the dragged element id'
 * @param event 'drag&drop-api event'
 */
function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

/**
 * @func drop
 * @description 'Implements the drop functionality for drag & drop api of puzzle pieces'
 * @param event 'drag&drop-api event'
 */
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

/**
 * @func startTimer
 * @description 'Starts the timer for a puzzle and displays it between the preview and the actual puzzle'
 */
function startTimer() {
    if (timeStarted != Date.now()) {
        timeStarted = Date.now();
        clearInterval(timerInterval);
    }

    if (drawTimer) {
        timer.parent().removeClass("d-none");
        timer.removeClass("timerSuccess");
        timerInterval = setInterval(countUp, 1000);
    }
}

/**
 * @func countUp
 * @description 'Used by an interval to count up the displayed timer'
 */
function countUp() {
    const deltaTime = Date.now() - timeStarted;
    const minutes = Math.floor(deltaTime / 1000 / 60);
    const seconds = Math.floor(deltaTime / 1000 % 60);

    const minuteString = minutes < 10 ? "0" + minutes : minutes;
    const secondsString = seconds < 10 ? "0" + seconds : seconds;

    timer.text(minuteString + ":" + secondsString);
}

/**
 * @func handleUpload
 * @description 'Handles the upload interaction from the upload button'
 */
function handleUpload() {
    // Check whether the upload actually happened, if not just return
    if (inputFile.prop("files").length == 0) {
        return;
    }

    // Set variables and reset Video & Puzzle
    file = inputFile.prop("files")[0];
    const inputURL = URL.createObjectURL(file);
    resetVideo();
    resetPuzzle();

    // If its a video, display it
    if (file.type.match("video/*")) {
        video.src = inputURL;
        video.muted = true;
        video.classList.add("container");
        video.setAttribute("id", "video-stream");
        video.setAttribute("autoplay", true);
        video.setAttribute("alt", "video-stream");
        video.setAttribute("loop", true);
        video.addEventListener('loadedmetadata', function () {
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            $("#video-stream").parent().removeClass("d-none");
            $("#video-stream").replaceWith(video);
            $("#generate-btn").removeClass("disabled");
        });
    } else if (file.type.match("image/*")) {
        puzzle.attr("src", inputURL);
        puzzle.removeClass("d-none");
    }
    $("#generate-btn").removeClass("disabled");
}

/**
 * @func generatePuzzlePieces
 * @description 'Generates the puzzle pieces for a given input image DOM'
 * @param originalImage 'The input image for the puzzle'
 */
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
    const deltaX = Math.floor(originalImage.naturalWidth / axisLength);
    const deltaY = Math.floor(originalImage.naturalHeight / axisLength);

    // delta values for the displayed images (need to do some rounding)
    const imageXDelta = Math.floor(puzzle.width() / axisLength);
    const imageYDelta = Math.floor(puzzle.height() / axisLength);

    tileStorage.css("width", (imageXDelta * axisLength + 24) + "px");
    tileStorage.css("height", (imageYDelta * axisLength + 24) + "px");

    const puzzlePattern = getRandomIndizies2d(axisLength);
    const borderColor = colorThief.getColor(originalImage);

    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            const offsetX = puzzlePattern[i * axisLength + j][0];
            const offsetY = puzzlePattern[i * axisLength + j][1];
            const tile = document.createElement("canvas");
            drawPuzzleTile(tile, deltaX, deltaY, offsetX, offsetY, originalImage, axisLength, borderColor);

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

            // Set initital tile size
            tile.style.width = imageXDelta + "px";
            tile.style.height = imageYDelta + "px";

            // Add event listeners for drag and drop
            tile.addEventListener('dragstart', drag);
            tile.addEventListener('dragover', allowDrop);
            tile.addEventListener('drop', drop);
            tileStorage[0].append(div);

            // Check whether tile was randomly placed in the right position
            checkTilePosition(tile);
        }
    }

    startTimer();
}

/**
 * @func finishPuzzle
 * @description 'Used to stop the timer and show that you succeded, also shows the modal for success'
 */
function finishPuzzle() {
    clearInterval(timerInterval);
    timer.addClass("timerSuccess");
    showModal();
}

/**
 * @func getRandomIndizies2d
 * @description 'Returns an Array with 2D-Coordinate touples for a fixed axislength with randomized value pairs'
 * @param axisLength 'Axislength of the square 2D-Coordinate-System'
 */
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

/**
 * @func shuffleArray
 * @description 'Implementation of the Durstenfeld shuffle for array randomization'
 * @param array 'The array that is supposed to be randomized'
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * @func checkTilePosition
 * @description 'Checks whether a current tile is in the right position, if so plays an animation, stops the tile from being able to move again and runs some logic.'
 * @param tile 'params0'
 */
function checkTilePosition(tile) {
    if (tile.parentNode.getAttribute("coordinate") === tile.getAttribute("id")) {
        tile.setAttribute("draggable", false);
        tile.setAttribute("landed", true);
        setInterval(function () {
            tile.removeAttribute("landed");
        }, 500);
        // Increment number of right pieces, if it was the last piece finish the puzzle
        rightPieces++;
        if (rightPieces == Math.pow(axisLength, 2)) {
            finishPuzzle();
        }
    }
}

/**
 * @func drawPuzzleTile
 * @description 'Draws a puzzle tile onto the given canvas'
 * @param canvas 'Canvas used to display that puzzle tile'
 * @param width 'width of a puzzle tile'
 * @param height 'height of a puzzle tile'
 * @param offsetX 'X-Offset on the X-Axis for the puzzle tile'
 * @param offsetY 'Y-Offset on the X-Axis for the puzzle tile'
 * @param source 'The input image from which the tile is being drawn'
 * @param axisLength 'The axis length of the puzzle'
 * @param borderColor 'Color of the border for the puzzle'
 */
function drawPuzzleTile(canvas, width, height, offsetX, offsetY, source, axisLength, borderColor) {
    canvas.width = width;
    canvas.height = height;

    canvasCtx = canvas.getContext("2d");
    canvasCtx.drawImage(source, offsetX * width, offsetY * height, width, height, 0, 0, width, height);

    if (drawBorder) {
        drawTileBorder(canvasCtx, width, height, offsetX, offsetY, axisLength, borderColor);
    }
}

/**
 * @func drawTileBorder
 * @description 'Draws the borders of an image onto the tile, if the tile is a borderpiece'
 * @param context 'tile context'
 * @param xCoord 'x-coordinate of the tile'
 * @param yCoord 'y-coordinate of the tile'
 * @param width 'width of the tile'
 * @param height 'height of the tile'
 * @param axisLength 'axis length of the puzzle'
 * @param rgbColor 'params6'
 */
function drawTileBorder(context, width, height, xCoord, yCoord, axisLength, rgbColor) {
    context.strokeStyle = "rgb(" + rgbColor[0] + ", " + rgbColor[1] + ", " + rgbColor[2] + ")";
    context.lineWidth = Math.ceil(width * 0.10);
    context.beginPath();

    // Left border piece
    if (xCoord == 0) {
        context.moveTo(0, 0);
        context.lineTo(0, height);
        context.stroke();
    }

    // Right Border piece
    if (xCoord == axisLength - 1) {
        context.moveTo(width, 0);
        context.lineTo(width, height);
        context.stroke();
    }

    // Top border piece
    if (yCoord == 0) {
        context.moveTo(0, 0);
        context.lineTo(width, 0);
        context.stroke();
    }

    // Bottom border piece
    if (yCoord == axisLength - 1) {
        context.moveTo(0, height);
        context.lineTo(width, height);
        context.stroke();
    }

    context.closePath();
}

/**
 * @func initializeWebcam
 * @description 'Tries to get a webcam with hd quality, if not tries to get one with vga constraints, if both fails shows an alert.'
 */
function initializeWebcam() {
    // Allow to reupload the same image/video that was uploaded before
    inputFile[0].value = '';
    resetVideo();
    const videoSource = webcamSelect.value;
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

    navigator.mediaDevices.getUserMedia(hdConstraints)
        .then(function (stream) {
            video.srcObject = stream;
            videoTrack = stream.getTracks()[0];
            resetPuzzle();
            setUpVideo();
        })
        .catch(function (hdError) {
            // If HD constraints fail, try VGA constraints
            navigator.mediaDevices.getUserMedia(vgaConstraints)
                .then(function (stream) {
                    video.srcObject = stream;
                    videoTrack = stream.getTracks()[0];
                    resetPuzzle();
                    setUpVideo();
                })
                .catch(function (vgaError) {
                    // Both HD and VGA constraints failed
                    resetVideo();
                    alert("Sorry, your selected webcam \"" + webcamSelect.options[webcamSelect.selectedIndex].text + "\" isn't supported or is unavailable. Try changing it in the settings.")
                });
        })
        .finally(function () {
            // This block will execute regardless of whether getUserMedia succeeded or failed
            navigator.mediaDevices.enumerateDevices().then(getVideoDevices);
        });
}

/**
 * @func setUpVideo
 * @description 'Sets up the video preview for a webcam / video-file'
 */
function setUpVideo() {
    video.setAttribute("id", "video-stream");
    video.setAttribute("autoplay", true);
    video.setAttribute("alt", "video-stream");
    video.classList.add("container");
    video.addEventListener('loadedmetadata', function () {
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
        $("#video-stream").parent().removeClass("d-none");
        $("#video-stream").replaceWith(video);
        $("#generate-btn").removeClass("disabled");
    });
}

/**
 * @func generateVideoPuzzlePieces
 * @description 'Draws the puzzle pieces from the video'
 * @param video 'Video source for the puzzle'
 */
function generateVideoPuzzlePieces(video) {
    /// Make sure all previous puzzle pieces and intervals are cleansed
    $(".tile-placeholder").remove();
    timerIntervals.forEach(function (interval) {
        clearInterval(interval);
    });
    timerIntervals = [];

    // get the tile storage
    const tileStorage = $("#tile-storage");

    // delta values for the actual image cropping
    const deltaX = Math.floor(videoWidth / axisLength);
    const deltaY = Math.floor(videoHeight / axisLength);

    // delta values for the displayed images (need to do some rounding)
    const proportion = videoHeight / videoWidth;
    const imageXDelta = Math.floor($("#video-stream").width() / axisLength);
    const imageYDelta = Math.floor($("#video-stream").width() * proportion / axisLength);

    tileStorage.css("width", (imageXDelta * axisLength + 24) + "px");
    tileStorage.css("height", (imageYDelta * axisLength + 24) + "px");

    // border color for the border
    const borderColor = isDarkMode() ? darkModeBorderColor : lightModeBorderColor;

    // Puzzle pattern for the randomly assigned puzzle pieces
    const puzzlePattern = getRandomIndizies2d(axisLength);

    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            const offsetX = puzzlePattern[i * axisLength + j][0];
            const offsetY = puzzlePattern[i * axisLength + j][1];

            // Canvas used for the current tile
            const tile = document.createElement("canvas");
            drawPuzzleTile(tile, deltaX, deltaY, offsetX, offsetY, video, axisLength, borderColor);

            timerIntervals.push(setInterval(function () {
                const border = isDarkMode() ? darkModeBorderColor : lightModeBorderColor;
                refreshTile(tile, deltaX, deltaY, offsetX, offsetY, video, axisLength, border);
            }, frameMS));

            // Setup the div containing the tile which stores extra information
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

            // Set initital tile size
            tile.style.width = imageXDelta + "px";
            tile.style.height = imageYDelta + "px";

            // Add event listeners for drag and drop
            tile.addEventListener('dragstart', drag);
            tile.addEventListener('dragover', allowDrop);
            tile.addEventListener('drop', drop);
            tileStorage[0].append(div);

            // Check whether the tile randomly started in the right spot, if so register it
            checkTilePosition(tile);
        }
    }

    startTimer();
}

/**
 * @func resizeTiles
 * @description 'Dynamically resizes all tiles to make the puzzle match the size of the original image/video'
 */
function resizeTiles() {
    const isVideo = !$("#video-stream").parent().hasClass("d-none")
    const isImage = !$("#puzzle-image").hasClass("d-none");
    var imageXDelta = 0;
    var imageYDelta = 0;

    if (isVideo) {
        imageXDelta = Math.floor($("#video-stream").width() / axisLength);
        imageYDelta = Math.floor($("#video-stream").height() / axisLength);
    } else if (isImage) {
        imageXDelta = Math.floor($("#puzzle-image").width() / axisLength);
        imageYDelta = Math.floor($("#puzzle-image").height() / axisLength);
    }

    if (isVideo || isImage) {
        var tileStorageWidth = imageXDelta * axisLength + 24;
        var tileStorageHeight = imageYDelta * axisLength + 24;
        $(".puzzle-tile").css("width", imageXDelta + "px");
        $(".puzzle-tile").css("height", imageYDelta + "px");
        $(".puzzle-tile").parent().css("width", imageXDelta + "px");
        $(".puzzle-tile").parent().css("height", imageYDelta + "px");
        $("#tile-storage").css("width", tileStorageWidth + "px");
        $("#tile-storage").css("height", tileStorageHeight + "px");
    }
}

/**
 * @func refreshTile
 * @description 'Refreshes a tiles frame from a Media-DOM source'
 * @param tileCanvas 'Canvas of a tile'
 * @param deltaX 'Width of the drawn area'
 * @param deltaY 'Height of the drawn area'
 * @param offsetX 'X-Offset of the tile in the video'
 * @param offsetY 'Y-Offset of the tile in the video'
 * @param source 'Input Source'
 * @param axisLength 'Axis length of the puzzle'
 * @param borderColor 'Border color'
 */
function refreshTile(tileCanvas, deltaX, deltaY, offsetX, offsetY, source, axisLength, borderColor) {
    tileCanvas.getContext("2d").save();
    drawPuzzleTile(tileCanvas, deltaX, deltaY, offsetX, offsetY, source, axisLength, borderColor);
    tileCanvas.getContext("2d").restore();
}

/**
 * @func resetPuzzle
 * @description 'Resets the UI containing the puzzle pieces and the currently displayed image'
 */
function resetPuzzle() {
    puzzle.addClass("d-none");
    $("#tile-storage").removeAttr("style");
    $("#tile-storage").removeClass("d-none");
    $(".tile-placeholder").remove();
    $("#generate-btn").addClass("disabled");
    timer.parent().addClass("d-none");
    clearInterval(timerInterval);
}

/**
 * @func resetVideo
 * @description 'Resets the UI containing puzzle pieces and the currently displayed video, also stops the tracking of the camera'
 */
function resetVideo() {
    resetWebcam();
    video = document.createElement("video");
    $("#video-stream").parent().addClass("d-none");
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

/**
 * @func resetWebcam
 * @description 'Checks whether a webcam exists, if so stops the stream and resets the webcam button'
 */
function resetWebcam() {
    if (videoTrack) {
        if (videoTrack.stop) { videoTrack.stop(); }
        videoTrack = null;
    }
    $("#webcam-btn").removeClass("btn-danger");
    $("#webcam-btn").addClass("btn-primary");
    $("#webcam-btn a").text("Start");
    $("#webcam-btn span").text("videocam");
}

/**
 * @func getVideoDevices
 * @description 'Gets all video devices and places them as a selectable option with their right value in the settings pannel'
 * @param deviceInfos 'Device Infos'
 */
function getVideoDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    while (webcamSelect.firstChild) {
        webcamSelect.removeChild(webcamSelect.firstChild);
    }

    var hasCameraOption = false;

    for (let i = 0; i !== deviceInfos.length; i++) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
            if (deviceInfo.deviceId) {
                hasCameraOption = true;
                option.text = deviceInfo.label || `camera ${webcamSelect.length + 1}`;
                webcamSelect.appendChild(option);
            }
        }
    }

    // If there is no valid camera option, disable the webcam button
    if (!hasCameraOption) {
        $("#webcam-btn").addClass("disabled");
    } else {
        $("#webcam-btn").removeClass("disabled");
    }
}


/**
 * @func closeStream
 * @description 'Close the acquired stream'
 * @param stream 'The stream'
 */
function closeStream(stream) {
    if (stream.getTracks[0].stop) {
        stream.getTracks()[0].stop();
    }
}

/**
 * @func webcamSelect.onchange
 * @description 'Add listener to change the webcam video source on the fly if it changes without removing the puzzle-tiles'
 */
webcamSelect.onchange = function () {
    // Only change to new webcam if already a webcam stream exists
    if (videoTrack) {
        setNewWebcam();
    }
}

/**
 * @func setNewWebcam
 * @description 'Sets the current webcam as video source for the preview and current puzzle-tiles'
 */
function setNewWebcam() {
    const videoSource = webcamSelect.value;
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
        setUpVideo();
    }, function (e) {
        navigator.getUserMedia(vgaConstraints, function (stream) {
            video.srcObject = stream;
            videoTrack = stream.getTracks()[0];
            setUpVideo();
        }, function (e) {
            // Only stop the old video track, you can still change to a valid one to keep puzzeling
            if (videoTrack) {
                if (videoTrack.stop) { videoTrack.stop(); }
            }
            alert("Sorry, your selected webcam \"" + webcamSelect.options[webcamSelect.selectedIndex].text + "\" isn't supported or is unavailable. Try changing it in the settings.")
        });
    });
}

/**
 * @func toggleWebcam
 * @description 'Used to toggle the webcam and the webcam button + start/stop webcam tracking'
 */
function toggleWebcam() {
    if (videoTrack) {
        resetVideo();
    } else {
        initializeWebcam();
        $("#webcam-btn").removeClass("btn-primary");
        $("#webcam-btn").addClass("btn-danger");
        $("#webcam-btn a").text("Stop");
        $("#webcam-btn span").text("videocam_off");
    }
}

/**
 * @func showModal
 * @description 'Shows the bootstrap success modal with the right text on a successful run'
 */
function showModal() {
    const modalText = $("#success-modal p");
    const timeSplit = timer.text() ? timer.text().split(":") : [0, 0];
    const minutes = parseInt(timeSplit[0]);
    const seconds = parseInt(timeSplit[1]);
    modalText.text("It only took you " + minutes + " minutes and " + seconds + " seconds to finish this puzzle!");
    // Select the toast container
    const myModal = bootstrap.Modal.getOrCreateInstance("#success-modal");
    myModal.show();
}

/**
 * @func isDarkMode
 * @description 'Returns true if the website is in dark-mode, otherwise false'
 */
function isDarkMode() {
    return $("html").attr("data-bs-theme") == "dark";
}