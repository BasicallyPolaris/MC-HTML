const inputImage = $("#file-upload");
inputImage.on("change", handleUpload);
$("#generate-btn").on("click", generatePuzzle);

function handleUpload() {
    $("#puzzle").attr("src", URL.createObjectURL(inputImage.prop("files")[0]));
    $("#puzzle").removeClass("d-none");
    $("#generate-btn").removeClass("disabled");
    $("#features").slideUp();
}

function generatePuzzle() {
    
}