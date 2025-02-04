import { useRef, useState, useEffect } from "react";
import { swapFace } from "../../server/api";

const CameraCapture = ({ goBack, goTo }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let countdownInterval;
    if (isCountingDown && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      onCapture();
      setIsCountingDown(false);
      setCountdown(3); //change the countdown here//
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isCountingDown, countdown]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      const video = videoRef.current;
      video.onloadedmetadata = () => {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      };
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  };

  const startCountdown = () => {
    setIsCountingDown(true);
  };

  const onCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setCapturedPhoto(blob);
      localStorage.setItem("capturedPhoto", URL.createObjectURL(blob));
    }, "image/jpeg");

    setIsVideoVisible(false);
  };

  const handleSwapFace = async (sourceImageBlob) => {
    const templateUrl = localStorage.getItem("selectedTemplate");
    const sourceFile = new File([sourceImageBlob], "source.jpg", {
      type: "image/jpeg",
    });

    setIsLoading(true);

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

  const handleCancel = () => {
    setCapturedPhoto(null);
    setIsVideoVisible(true);
    startCamera();
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
            <div className="relative">
              <video ref={videoRef} autoPlay className="w-4/5 h-auto m-auto" />
              {isCountingDown && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center justify-center w-40 h-40 bg-black bg-opacity-50 rounded-full">
                    <span className="text-white text-[8em] font-bold animate-pulse">
                      {countdown}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden bg-white" />

          {!isVideoVisible && capturedPhoto && (
            <img
              src={URL.createObjectURL(capturedPhoto)}
              alt="Captured"
              className="w-4/5 h-auto m-auto"
            />
          )}

          <div className="space-x-6">
            {isVideoVisible ? (
              <>
                <button
                  onClick={goBack}
                  className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
                  disabled={isCountingDown}
                >
                  Back
                </button>
                <button
                  onClick={startCountdown}
                  className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
                  disabled={isCountingDown}
                >
                  Capture
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
                >
                  Retake
                </button>
                <button
                  onClick={() => handleSwapFace(capturedPhoto)}
                  className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white text-[2.8em]"
                >
                  Process
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;