// script.js

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const templateOptions = document.getElementById("templateOptions");
  const previewImage = document.getElementById("previewImage");
  const sourceFile = document.getElementById("sourceFile");
  const startWebcamButton = document.getElementById("startWebcam");
  const captureImageButton = document.getElementById("captureImage");
  const webcamVideo = document.getElementById("webcam");
  const captureCanvas = document.getElementById("captureCanvas");
  const processButton = document.getElementById("processButton");
  const resetButton = document.getElementById("resetButton");
  const resultImage = document.getElementById("resultImage");
  const progressFill = document.getElementById("progressFill");
  const actionButton = document.getElementById("actionButtons");

  let selectedTemplate = null;
  let webcamStream = null;
  let capturedImage = null;

  // Fetch and display template options
  fetch("/api/templates")
    .then((response) => response.json())
    .then((templates) => {
      templates.forEach((template) => {
        const img = document.createElement("img");
        img.src = `/api/template/${template}`;
        img.alt = template;
        img.classList.add("template-button");
        img.addEventListener("click", () => selectTemplate(template, img));
        templateOptions.appendChild(img);
      });
    });

  // Select template
  function selectTemplate(template, element) {
    selectedTemplate = template;
    document
      .querySelectorAll(".template-button")
      .forEach((el) => el.classList.remove("selected"));
    element.classList.add("selected");
    previewImage.src = `/api/template/${template}`;
  }

  // Start webcam
  startWebcamButton.addEventListener("click", async () => {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamVideo.srcObject = webcamStream;
      webcamVideo.style.display = "block";
      captureImageButton.disabled = false;
      captureImageButton.style.display = "block";
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  });

  // Capture image
  captureImageButton.addEventListener("click", () => {
    if (webcamStream) {
      captureCanvas.width = webcamVideo.videoWidth;
      captureCanvas.height = webcamVideo.videoHeight;
      captureCanvas.getContext("2d").drawImage(webcamVideo, 0, 0);
      capturedImage = captureCanvas.toDataURL("image/jpeg");

      // Display captured image and hide video
      webcamVideo.style.display = "none";
      captureCanvas.style.display = "block";
      actionButton.style.display = "flex";

      // Stop the webcam stream
      webcamStream.getTracks().forEach((track) => track.stop());
      webcamStream = null;

      // Disable capture button and enable process button
      captureImageButton.disabled = true;
      processButton.disabled = false;
    }
  });

  // Process face swap
  processButton.addEventListener("click", async () => {
    if (!selectedTemplate || (!sourceFile.files[0] && !capturedImage)) {
      alert("Please select both template and source images.");
      return;
    }

    const formData = new FormData();
    formData.append("template", selectedTemplate);

    if (capturedImage) {
      // If we have a captured image from webcam, use that
      formData.append(
        "source",
        dataURLtoFile(capturedImage, "captured_image.jpg")
      );
    } else {
      // Otherwise, use the file input
      formData.append("source", sourceFile.files[0]);
    }

    try {
      progressFill.style.width = "50%";
      const response = await fetch("/api/swap", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      resultImage.src = `data:image/jpeg;base64,${data.image}`;
      progressFill.style.width = "100%";
    } catch (error) {
      console.error("Error during face swap:", error);
      progressFill.style.width = "0%";
    }
  });

  // Reset application
  resetButton.addEventListener("click", () => {
    selectedTemplate = null;
    capturedImage = null;
    document
      .querySelectorAll(".template-button")
      .forEach((el) => el.classList.remove("selected"));
    previewImage.src = "";
    sourceFile.value = "";
    resultImage.src = "";
    progressFill.style.width = "0%";
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      webcamStream = null;
    }
    webcamVideo.srcObject = null;
    webcamVideo.style.display = "none";
    captureCanvas.style.display = "none";
    captureImageButton.disabled = true;
    processButton.disabled = false;
  });

  // Helper function to convert data URL to File object
  function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // Initially disable capture and process buttons
  captureImageButton.disabled = true;
  processButton.disabled = true;
});
