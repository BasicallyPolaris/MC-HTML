// Variables used for the puzzle tiles
const colorThief = new ColorThief();
const inputFile = $("#file-upload");
const puzzle = $("#puzzle-image");
const timer = $("#timer");
var drawBorder = true;
var drawTimer = true;
var useMedianColor = false;
var useCustomColor = false;

// Variables used for the Timer
var timeStarted;
var timerInterval;
var rightPieces = 0;

// Variables used for the video puzzle
var videoWidth = 0;
var videoHeight = 0;
var video = document.createElement('video');
var videoTrack;
var videoRefreshInterval;
var axisLength = 0;
// Color of the tertiary background from bootstrap in light-mode
const lightModeBorderColor = "#E9ECEF";
// Color of the tertiary background from bootstrap in dark-mode
const darkModeBorderColor = "#343A40";

// Webcam-Source selectors
const webcamSelect = $("#webcam-select")[0];
const videoSource = webcamSelect.value;

// Stores the actual file that was uploaded most recently
var file;

// Enumerate devices if you already have the permission for them
navigator.mediaDevices.enumerateDevices().then(getVideoDevices);

// Setup all event listeners
setUpEventListeners();

/**
 * @func setupEventListeners
 * @description 'Sets up all needed event listeners for the functions'
 */
function setUpEventListeners() {
    /**
     * @description 'Listener to handle the file upload via button'
     */
    inputFile.on("change", handleUpload);

    /**
     * @description 'Listener used to dynamically resize all tiles with a window resize'
     */
    window.addEventListener("resize", resizeTiles);

    /**
     * @func webcamSelect.onchange
     * @description 'Listener to change the webcam video source on the fly if it changes without removing the puzzle-tiles'
     */
    webcamSelect.onchange = function () {
        // Only change to new webcam if already a webcam stream exists
        if (videoTrack) {
            setNewWebcam();
        }
    }

    /**
     * @func fps-select.onchange
     * @description 'Listener to change framerate of video dependent on fps-select, only if video-puzzle is present'
     */
    $("#fps-select").on("change", function () {
        if (videoRefreshInterval) {
            clearInterval(videoRefreshInterval);
            videoRefreshInterval = setInterval(function () {
                refreshTiles();
            }, $("#fps-select").val());
        }
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
     * @description 'Listener used to dynamically change whether the borders are shown on the puzzle tiles by configuring it in the settings tab'
     */
    $("#generate-border-switch").on("click", function () {
        drawBorder = !drawBorder;
        const medianColorSwitch = $("#median-color-switch");
        const customColorSwitch = $("#custom-color-switch");
        const customColorInput = $("#custom-color-input");

        // Set the right disabled attributes for the settings
        if (!drawBorder) {
            medianColorSwitch.attr("disabled", true);
            customColorSwitch.attr("disabled", true);
            customColorInput.attr("disabled", true);
        } else {
            if (useCustomColor || videoHeight !== 0) {
                customColorSwitch.removeAttr("disabled");
                customColorInput.removeAttr("disabled");
            } else if (useMedianColor) {
                medianColorSwitch.removeAttr("disabled");
            } else {
                medianColorSwitch.removeAttr("disabled");
                customColorSwitch.removeAttr("disabled");
                customColorInput.removeAttr("disabled");
            }
        }

        refreshTiles();
    });

    /**
     * @description 'Listener used to dynamically change the border color to the median color by configuring it in the settings tab'
     */
    $("#median-color-switch").on("click", function () {
        useMedianColor = !useMedianColor;
        // Togle custom color switch to be disabled / enabled
        const customColorSwitch = $("#custom-color-switch");
        const customColorInput = $("#custom-color-input");
        if (useMedianColor) {
            customColorSwitch.attr("disabled", true);
            customColorInput.attr("disabled", true);
        } else {
            customColorSwitch.removeAttr("disabled");
            customColorInput.removeAttr("disabled");
        }
        refreshTiles();
    });

    /**
     * @description 'Listener used to dynamically change the border color to the custom color when changing it in the settings tab while custom color is active'
     */
    $("#custom-color-switch").on("click", function () {
        useCustomColor = !useCustomColor;
        // Togle median color switch to be disabled / enabled
        const medianColorSwitch = $("#median-color-switch");
        // Only remove the attr disabled of the median switch if we aren't watching a video
        if (useCustomColor || videoHeight > 0) {
            medianColorSwitch.attr("disabled", true);
        } else {
            medianColorSwitch.removeAttr("disabled");
        }
        refreshTiles();
    });


    /**
     * @description 'Listener used to dynamically change the border color to the custom color by configuring it in the settings tab'
     */
    $("#custom-color-input").on("change", function () {
        if (useCustomColor) {
            refreshTiles();
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
            generateImagePuzzlePieces(puzzle[0]);
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
}

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
 * @func isDarkMode
 * @description 'Returns true if the website is in dark-mode, otherwise false'
 */
function isDarkMode() {
    return $("html").attr("data-bs-theme") == "dark";
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
        timer.removeClass("timer-success");
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
    resetAll();
    resetPuzzle();

    // If its a video, display it
    if (file.type.match("video/*")) {
        // Dissable useless settings for videos
        if (useMedianColor) {
            $("#median-color-switch").click()
        }
        $("#median-color-switch").attr("disabled", true);

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
 * @func rgbToHex
 * @description 'Calculates the hexcode of an rgb color in array format'
 * @param rgbArray 'RGB color in array format'
 */
function rgbToHex(rgbArray) {
    return "#" + rgbArray.map(value => {
        const hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * @func getBorderColor
 * @description 'Returns the border color'
 */
function getBorderColor() {
    const isImage = !$("#puzzle-image").hasClass("d-none");
    var borderColor = isDarkMode() ? darkModeBorderColor : lightModeBorderColor;

    if (useCustomColor) {
        borderColor = $("#custom-color-input").val();
    } else if (isImage && useMedianColor) {
        borderColor = rgbToHex(colorThief.getColor($("#puzzle-image")[0]));
    }

    return borderColor;
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
 * @param hexColor 'Hex Value of a color'
 */
function drawTileBorder(context, width, height, xCoord, yCoord, axisLength, hexColor) {
    context.strokeStyle = hexColor;
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
 * @func generateImagePuzzlePieces
 * @description 'Generates the puzzle pieces for a given input image DOM'
 * @param originalImage 'The input image for the puzzle'
 */
function generateImagePuzzlePieces(originalImage) {
    const targetWidth = originalImage.naturalWidth;
    const targetHeight = originalImage.naturalHeight;

    generatePuzzlePieces(originalImage, $("#puzzle-image"), targetWidth, targetHeight);
}

/**
 * @func generateVideoPuzzlePieces
 * @description 'Draws the puzzle pieces from the video'
 * @param video 'Video source for the puzzle'
 */
function generateVideoPuzzlePieces(video) {
    const targetWidth = videoWidth;
    const targetHeight = videoHeight;
    generatePuzzlePieces(video, $("#video-stream"), targetWidth, targetHeight);

    videoRefreshInterval = setInterval(function () {
        refreshTiles();
    }, $("#fps-select").val());
}

/**
 * @func generatePuzzlePieces
 * @param targetWidth 'params0'
 * @param targetHeight 'params1'
 * @param eventListenersAdder 'params2'
 */

/**
 * @func generatePuzzlePieces
 * @description 'Generates the whole puzzle for a given targetwidth and targetheight and source'
 * @param source 'Source for the puzzle'
 * @param preview 'Preview jquery object of the puzzle (wrapper of video/image preview)'
 * @param targetWidth 'amount of pixels to be cropped on X axis per tile'
 * @param targetHeight 'amount of pixels to be cropped on Y axis per tile'
 */
function generatePuzzlePieces(source, preview, targetWidth, targetHeight) {
    /// Make sure all previous puzzle pieces and intervals are deleted
    $(".tile-placeholder").remove();
    clearInterval(videoRefreshInterval);
    videoRefreshInterval = null;

    // get the tile container
    const puzzleContainer = $("#puzzle-container")

    // delta values for the actual image cropping - round down to prevent white borders due to overdrawing and to secure equal tile sizes
    const deltaX = Math.floor(targetWidth / axisLength);
    const deltaY = Math.floor(targetHeight / axisLength);

    // Calculate proportion of cropped tiles (not exactly the original proportion) and then calculate tile sizes
    const proportion = preview.height() / preview.width();
    const puzzleTileWidth = Math.floor(preview.width() / axisLength);
    const puzzleTileHeight = Math.floor(preview.width() * proportion / axisLength);

    // Give the puzzle container the right size (+ 24 to account for padding of container)
    puzzleContainer.css("width", (puzzleTileWidth * axisLength + 24) + "px");
    puzzleContainer.css("height", (puzzleTileHeight * axisLength + 24) + "px");

    // border color for the border
    const borderColor = getBorderColor();

    // Puzzle pattern for the randomly assigned puzzle pieces
    const puzzlePattern = getRandomIndizies2d(axisLength);
    const halfOfTiles = Math.ceil(axisLength * axisLength / 2);

    for (let i = 0; i < axisLength; i++) {
        for (let j = 0; j < axisLength; j++) {
            const offsetX = puzzlePattern[i * axisLength + j][0];
            const offsetY = puzzlePattern[i * axisLength + j][1];

            // Canvas used for the current tile
            const tile = document.createElement("canvas");
            drawPuzzleTile(tile, deltaX, deltaY, offsetX, offsetY, source, axisLength, borderColor);

            // Setup the div containing the tile which stores extra information
            const puzzleContainerElement = document.createElement("div");
            puzzleContainerElement.classList.add("d-inline-block");
            puzzleContainerElement.classList.add("tile-placeholder")
            puzzleContainerElement.classList.add("tile-container-lightmode");
            puzzleContainerElement.setAttribute("id", "div-tile-" + i + "-" + j);
            puzzleContainerElement.setAttribute("coordinate", "tile-" + i + "-" + j);
            puzzleContainerElement.style.width = puzzleTileWidth + "px";
            puzzleContainerElement.style.height = puzzleTileHeight + "px";

            // Set id and class and attribute for logic and looks
            tile.setAttribute("id", "tile-" + offsetY + "-" + offsetX);
            tile.setAttribute("class", "puzzle-tile");
            tile.setAttribute("draggable", true);

            // Set initital tile size
            tile.style.width = puzzleTileWidth + "px";
            tile.style.height = puzzleTileHeight + "px";

            // Add event listeners for drag and drop
            tile.addEventListener('dragstart', drag);
            tile.addEventListener('dragover', allowDrop);
            tile.addEventListener('drop', drop);

            // Append the elements in the right order
            puzzleContainerElement.append(tile);
            puzzleContainer[0].append(puzzleContainerElement);

            // Check whether the tile randomly started in the right spot, if so register it
            checkTilePosition(tile);
        }
    }

    startTimer();
    puzzleContainer[0].scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
}

/**
 * @func checkTilePosition
 * @description 'Checks whether a current tile is in the right position, if so plays an animation, stops the tile from being able to move again and runs some logic.'
 * @param tile 'params0'
 */
function checkTilePosition(tile) {
    if (tile.parentNode.hasAttribute("coordinate") && tile.parentNode.getAttribute("coordinate") === tile.getAttribute("id")) {
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
 * @func finishPuzzle
 * @description 'Used to stop the timer and show that you succeded, also shows the modal for success'
 */
function finishPuzzle() {
    clearInterval(timerInterval);
    timer.addClass("timer-success");
    showModal();
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
 * @func setUpVideo
 * @description 'Sets up the video preview for a webcam / video-file'
 */
function setUpVideo() {
    // Disabled useless setting for video
    if (useMedianColor) {
        $("#median-color-switch").click();
    }
    $("#median-color-switch").attr("disabled", true);

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
 * @func initializeWebcam
 * @description 'Tries to get a webcam with hd quality, if not tries to get one with vga constraints, if both fails shows an alert.'
 */
function initializeWebcam() {
    // Allow to reupload the same image/video that was uploaded before
    inputFile[0].value = '';
    resetAll();
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
                    resetAll();
                    alert("Sorry, your selected webcam \"" + webcamSelect.options[webcamSelect.selectedIndex].text + "\" isn't supported or is unavailable. Try changing it in the settings.")
                });
        })
        .finally(function () {
            // This block will execute regardless of whether getUserMedia succeeded or failed
            navigator.mediaDevices.enumerateDevices().then(getVideoDevices);
        });
}

/**
 * @func resizeTiles
 * @description 'Dynamically resizes all tiles to make the puzzle match the size of the original image/video'
 */
function resizeTiles() {
    const isVideo = !$("#video-stream").parent().hasClass("d-none")
    const isImage = !$("#puzzle-image").hasClass("d-none");
    var puzzleTileWidth = 0;
    var puzzleTileHeight = 0;

    if (isVideo) {
        puzzleTileWidth = Math.floor($("#video-stream").width() / axisLength);
        puzzleTileHeight = Math.floor($("#video-stream").height() / axisLength);
    } else if (isImage) {
        puzzleTileWidth = Math.floor($("#puzzle-image").width() / axisLength);
        puzzleTileHeight = Math.floor($("#puzzle-image").height() / axisLength);
    }

    if (isVideo || isImage) {
        var tileContainerWidth = puzzleTileWidth * axisLength + 24;
        var tileContainerHeight = puzzleTileHeight * axisLength + 24;
        $(".puzzle-tile").css("width", puzzleTileWidth + "px");
        $(".puzzle-tile").css("height", puzzleTileHeight + "px");
        $(".puzzle-tile").parent().css("width", puzzleTileWidth + "px");
        $(".puzzle-tile").parent().css("height", puzzleTileHeight + "px");
        $("#puzzle-container").css("width", tileContainerWidth + "px");
        $("#puzzle-container").css("height", tileContainerHeight + "px");
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
 * @func refreshTileBorders
 * @description 'Function used to refresh the tile borders of an image'
 */
function refreshTiles() {
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
    const borderColor = getBorderColor();

    if (isVideo) {
        source = video;
        deltaX = Math.floor(videoWidth / axisLength);
        deltaY = Math.floor(videoHeight / axisLength);
    } else if (isImage) {
        source = puzzle[0];
        deltaX = Math.floor(source.naturalWidth / axisLength);
        deltaY = Math.floor(source.naturalHeight / axisLength);
    }

    $(".puzzle-tile").each(function () {
        const tileIdSplit = $(this).attr("id").split("-");
        const offsetX = tileIdSplit[2];
        const offsetY = tileIdSplit[1];
        refreshTile($(this)[0], deltaX, deltaY, offsetX, offsetY, source, axisLength, borderColor);
    });
}

/**
 * @func resetVideo
 * @description 'Resets the UI containing puzzle pieces and the currently displayed video, also stops the tracking of the camera'
 */
function resetAll() {
    resetWebcam();
    if (!useCustomColor) {
        $("#median-color-switch").removeAttr("disabled");
    }
    videoWidth = 0;
    videoHeight = 0;
    video = document.createElement("video");
    resetPuzzle();
    clearInterval(videoRefreshInterval);
    videoRefreshInterval = null;
}

/**
 * @func resetPuzzle
 * @description 'Resets the UI containing the puzzle pieces and the currently displayed image'
 */
function resetPuzzle() {
    puzzle.addClass("d-none");
    $("#video-stream").parent().addClass("d-none");
    $("#puzzle-container").removeAttr("style");
    $("#puzzle-container").removeClass("d-none");
    $(".tile-placeholder").remove();
    $("#generate-btn").addClass("disabled");
    // Reset Timer
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
    // Define variables to reselect the previous selected camera on reset
    const previousSelected = webcamSelect.value;

    // Handles being called several times to update labels. Preserve values.
    while (webcamSelect.firstChild) {
        webcamSelect.removeChild(webcamSelect.firstChild);
    }

    // Used to iterate through the new index, if the old device is found select it
    var videoIndex = 0;
    var previousIndex = 0;

    for (let i = 0; i !== deviceInfos.length; i++) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
            if (deviceInfo.deviceId) {
                if (deviceInfo.deviceId == previousSelected) {
                    previousIndex = videoIndex;
                }
                videoIndex++;
                option.text = deviceInfo.label || `camera ${webcamSelect.length + 1}`;
                webcamSelect.appendChild(option);
            }
        }
    }

    // Select old device or index 0
    webcamSelect.selectedIndex = previousIndex;
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
        resetAll();
    } else {
        initializeWebcam();
        $("#webcam-btn").removeClass("btn-primary");
        $("#webcam-btn").addClass("btn-danger");
        $("#webcam-btn a").text("Stop");
        $("#webcam-btn span").text("videocam_off");
    }
}