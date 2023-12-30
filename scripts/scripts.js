const inputImage = $("#file-upload");
const puzzle = $("#puzzle");
var inputImageURL;
inputImage.on("change", handleUpload);
$("#generate-btn").on("click", generatePuzzle);

// Handles the upload of an image
function handleUpload() {
    inputImageURL = URL.createObjectURL(inputImage.prop("files")[0]);
    puzzle.attr("src", inputImageURL);
    puzzle.removeClass("d-none");
    $("#generate-btn").removeClass("disabled");
    $("#features").slideUp();
    $("#hero").children().first().addClass("mb-0");
}

function generatePuzzle() {
    $("#generate-btn").addClass("disabled");
    const tileAmount = $("#tileOptions").find(":selected").val();
    const originalImage = $("#puzzle")[0];
    const tileStorage = $("#tile-storage")[0];

    const deltaX = Math.floor(originalImage.naturalWidth / Math.sqrt(tileAmount));
    const deltaY = Math.floor(originalImage.naturalHeight / Math.sqrt(tileAmount));
    tileStorage.setAttribute("width", 10*deltaX);

    for (let i = 0; i < Math.sqrt(tileAmount); i++) {
        for (let j = 0; j < Math.sqrt(tileAmount); j++) {
            var canvas = document.createElement("canvas");
            canvas.width = deltaX;
            canvas.height = deltaY;
            canvas.getContext("2d").drawImage(originalImage, i*deltaX, j*deltaY, deltaX, deltaY, 0, 0, deltaX, deltaY);

            var tile = new Image();
            tile.src = canvas.toDataURL();
            tile.setAttribute("id", "tile-"+i+"-"+j)
            tileStorage.append(tile);
        }
    }
}