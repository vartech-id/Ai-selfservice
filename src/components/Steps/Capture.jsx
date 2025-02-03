import React, { useRef, useState } from "react";
import { swapFace } from "../../server/api";

const CameraCapture = ({ goBack, goTo }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Start the camera feed
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      // Ensure the canvas matches the video dimensions
      const video = videoRef.current;
      video.onloadedmetadata = () => {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      };
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

    setIsLoading(true);

    // Solusi: pindahin goTo ke finally
    try {
      const swappedImageUrl = await swapFace(templateUrl, sourceFile);
      if (swappedImageUrl) {
        setCapturedPhoto(swappedImageUrl);
        localStorage.setItem("swappedPhoto", swappedImageUrl);
      }
    } catch (error) {
      console.error("Error swapping face:", error);
    } finally {
      setIsLoading(false);
      goTo();
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    setCapturedPhoto(null); // Reset captured photo
    setIsVideoVisible(true); // Re-enable video feed
    startCamera(); // Restart the camera feed
  };

  return (
    <div className="text-center space-y-[6rem]">
      {isLoading ? (
        <div className="z-10 absolute inset-0 grid mb-[5em]">
          <img src="/loading.gif" alt="loading" className="m-auto w-2/5" />
        </div>
      ) : (
        <>
          <h1 className="text-white text-[5em] font-bold">
            Look at the Camera
          </h1>

          {isVideoVisible && (
            <video ref={videoRef} autoPlay className="w-4/5 h-auto m-auto" />
          )}

          <canvas ref={canvasRef} className="hidden bg-white" />

          {isLoading
            ? ""
            : capturedPhoto && (
                <img
                  src={URL.createObjectURL(capturedPhoto)}
                  alt="Captured"
                  className="w-4/5 h-auto m-auto"
                />
              )}

          <button
            onClick={capturedPhoto === null ? onCapture : handleCancel}
            className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
          >
            {capturedPhoto === null ? "Capture Photo" : "Cancel"}
          </button>

          <div className="space-x-6">
            <button
              onClick={goBack}
              className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
            >
              Back
            </button>
            <button
              onClick={
                capturedPhoto === null
                  ? startCamera
                  : () => handleSwapFace(capturedPhoto)
              }
              className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
            >
              {capturedPhoto === null ? "Start Camera" : "Swap Face"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
