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

    for (let i = 0; i < tileAxis; i++) {
        for (let j = 0; j < tileAxis; j++) {
            var canvas = document.createElement("canvas");
            canvas.width = deltaX;
            canvas.height = deltaY;
            canvas.getContext("2d").drawImage(originalImage, j*deltaX, i*deltaY, deltaX, deltaY, 0, 0, deltaX, deltaY);

            var tile = new Image();
            tile.src = canvas.toDataURL();
            tile.setAttribute("id", "tile-"+i+"-"+j);
            tile.setAttribute("class", "puzzle-tile");
            tileStorage[0].append(tile);
            $("#tile-"+i+"-"+j).css("width", imageXDelta + "px");
            $("#tile-"+i+"-"+j).css("height", imageYDelta + "px");
        }
    }
}