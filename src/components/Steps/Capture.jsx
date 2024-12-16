import React, { useRef, useState } from "react";
import { swapFace } from "../../server/api";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isVideoVisible, setIsVideoVisible] = useState(true);

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

    canvas.toBlob(async (blob) => {
      const imageUrl = URL.createObjectURL(blob);
      setCapturedPhoto(imageUrl);
      localStorage.setItem("capturedPhoto", imageUrl);
      await handleSwapFace(blob);
    }, "image/jpeg");

    setIsVideoVisible(false);
  };

  // Handle face swap API
  const handleSwapFace = async (sourceImageBlob) => {
    const templateUrl = "path/to/default/template.jpg";
    try {
      const swappedImageUrl = await swapFace(templateUrl, sourceImageBlob);
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

  const selectedTemplate = localStorage.getItem("selectedTemplate")

  return (
    <div>
      <h1>{selectedTemplate}</h1>
      <h2>Camera Capture</h2>

      {isVideoVisible && (
        <video ref={videoRef} autoPlay className="w-screen h-screen" />
      )}

      <button onClick={startCamera}>Start Camera</button>
      <button onClick={onCapture}>Capture Photo</button>

      {/* Cancel button */}
      <button onClick={handleCancel}>Cancel</button>

      <canvas ref={canvasRef} className="hidden" />

      {capturedPhoto && (
        <div>
          <h3>Captured Photo</h3>
          <img
            src={capturedPhoto}
            alt="Captured"
            className="w-1/2 h-auto m-auto"
          />
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
