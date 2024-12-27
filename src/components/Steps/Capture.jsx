import React, { useRef, useState } from "react";
import { swapFace, saveUserData } from "../../server/api";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isVideoVisible, setIsVideoVisible] = useState(true);

  console.log(capturedPhoto);

  // Start the camera feed
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  };

  // Capture photo from the video feed
  const onCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setCapturedPhoto(blob); // Set the blob directly, not the image URL
      localStorage.setItem("capturedPhoto", URL.createObjectURL(blob)); // You can still store the URL for preview
    }, "image/jpeg");

    setIsVideoVisible(false);
  };

  // Handle face swap API
  const handleSwapFace = async (sourceImageBlob) => {
    const templateUrl = localStorage.getItem("selectedTemplate"); // This should be the URL

    const sourceFile = new File([sourceImageBlob], "source.jpg", {
      type: "image/jpeg",
    });

    try {
      const swappedImageUrl = await swapFace(templateUrl, sourceFile);
      if (swappedImageUrl) {
        setCapturedPhoto(swappedImageUrl);
        localStorage.setItem("swappedPhoto", swappedImageUrl);
      }
    } catch (error) {
      console.error("Error swapping face:", error);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    setCapturedPhoto(null); // Reset captured photo
    setIsVideoVisible(true); // Re-enable video feed
    startCamera(); // Restart the camera feed
  };

  const selectedTemplate = localStorage.getItem("selectedTemplate");

  const handleUserData = async () => {
    const name = localStorage.getItem("name");
    const phone = localStorage.getItem("phone");

    const userData = {
      name: name,
      phone: phone,
    };

    const result = await saveUserData(userData);

    if (result) {
      console.log("User data saved:", result);
    } else {
      console.error("Failed to save user data");
    }
  };

  return (
    <div className="text-center">
      {/* <h1>{selectedTemplate}</h1> */}
      <h1 className="text-white text-[5em] font-bold">Choose Your AI</h1>
      <h2>Camera Capture</h2>

      {isVideoVisible && (
        <video ref={videoRef} autoPlay className="w-[100%] h-[400px]" />
      )}

      <button onClick={startCamera}>Start Camera</button>
      <button onClick={onCapture}>Capture Photo</button>

      {/* Cancel button */}
      <button onClick={handleCancel}>Cancel</button>

      <canvas ref={canvasRef} className="hidden bg-white" />

      {capturedPhoto && (
        <div>
          <h3>Captured Photo</h3>
          <img
            src={URL.createObjectURL(capturedPhoto)} // Use Object URL for previewing the Blob
            alt="Captured"
            className="w-1/2 h-auto m-auto"
          />
        </div>
      )}

      <button onClick={() => handleSwapFace(capturedPhoto)}>Swap Face</button>

      <button onClick={() => handleUserData()}>Save Data</button>
    </div>
  );
};

export default CameraCapture;
