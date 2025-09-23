import React, { useState } from "react";
import { printImage, sendWhatsApp } from "../../server/api";
import axios from "axios"; // masih butuh buat upload image
import { FaWhatsapp } from "react-icons/fa";
const API_BASE_URL = " http://127.0.0.1:5000/api"; // rubah url http://127.0.0.1:5000 ke ngrok URL

const Result = () => {
  const [qrCode, setQRCode] = useState(false);
  const [print, setPrint] = useState(false);
  const [printMessage, setPrintMessage] = useState(false);
  const [printer, setPrinter] = useState(""); // Printer selection
  const [printSize, setPrintSize] = useState("4x6"); // Default print size
  const [loading, setLoading] = useState(false);
  const [waMessage, setWaMessage] = useState(null);

  const handlePrint = async () => {
    const result = localStorage.getItem("swappedPhoto");

    if (!result) {
      alert("No image found to print!");
      return;
    }

    try {
      const imageBlob = await fetch(result).then((res) => res.blob());
      const response = await printImage(imageBlob, printer, printSize);

      if (response.message) {
        setPrint(false);
        PopUpPrint();
      } else {
        alert("Failed to print image.");
      }
    } catch (error) {
      console.error("Error during print:", error);
      alert("An error occurred while printing.");
    }
  };

  const PopUpPrint = () => {
    setPrintMessage(true);

    setTimeout(() => {
      setPrintMessage(false);
    }, 2000);
  };

  const PopUpWA = (message) => {
    setWaMessage(message);
    setTimeout(() => {
      setWaMessage(null);
    }, 2500);
  };

  const handleSendWhatsApp = async () => {
    setLoading(true);
    try {
      const swappedPhoto = localStorage.getItem("swappedPhoto");
      if (!swappedPhoto) {
        PopUpWA("No image found!");
        return;
      }

      // convert base64 -> Blob -> File
      const blob = await fetch(swappedPhoto).then((res) => res.blob());
      const file = new File([blob], "result.jpg", { type: blob.type });

      // Upload ke /api/save-image
      const formData = new FormData();
      formData.append("image", file);

      const saveRes = await axios.post(`${API_BASE_URL}/save-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = saveRes.data.url;
      console.log("Image saved at:", imageUrl);

      const phone = localStorage.getItem("userPhone"); // pastikan format 62xxxx
      if (!phone) {
        PopUpWA("No phone number found!");
        return;
      }

      // pake sendWhatsApp dari api.jsx
      const waRes = await sendWhatsApp(phone, imageUrl);

      console.log("WA Response:", waRes);
      PopUpWA("Successfully Sent to WhatsApp!");
//       localStorage.clear();
    } catch (err) {
      console.error("Error sending WhatsApp:", err);
      PopUpWA("Gagal kirim ke WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="text-white text-[5em] font-bold">This is Yours</h1>

      <img
        src={localStorage.getItem("swappedPhoto")}
        alt="Swapped result"
        className="w-3/5 my-[6rem]"
      />

      <div className="flex items-center justify-center gap-4">
        <button
            onClick={handleSendWhatsApp}
            disabled={loading}
            className={`rounded-2xl p-4 flex items-center justify-center shadow-lg transition ${
            loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            }`}
            aria-label="Send to WhatsApp"
            title="Send to WhatsApp"
        >
            {loading ? (
            <span className="text-white text-lg font-medium">Sending...</span>
            ) : (
            <img
                src="/whatsapp-icon.png" // taro PNG di folder public
                alt="WhatsApp"
                className="w-16 h-16"
            />
            )}
        </button>
        <div>
          <img
            // Taro di public folder
            src="/qrcode.png"
            alt="QR code icon"
            onClick={() => {
              setQRCode((prevState) => !prevState);
              setPrint(false);
            }}
          />
        </div>
        <div>
          <img
            src="/print.png"
            alt="Print icon"
            onClick={() => {
              setPrint((prevState) => !prevState);
              setQRCode(false);
            }}
          />
        </div>
      </div>

      {qrCode && (
        <div className="z-10 absolute inset-0 bg-black/80 grid">
          <img
            src="/Hasil.png"
            alt="QR Code Result"
            onClick={() => setQRCode(false)}
            className="w-3/5 m-auto"
          />
        </div>
      )}

      {print && (
        <div className="z-10 absolute inset-0 bg-black/80 text-white grid text-[4em] p-4">
          <div className="m-auto">
            <h1 className="mb-4">Print the image?</h1>
            <div className="flex gap-4">
              <button
                className="bg-red-500 text-white p-2 w-1/2 rounded-md"
                onClick={() => setPrint(false)}
              >
                No
              </button>
              <button
                className="bg-green-500 text-white p-2 w-1/2 rounded-md"
                onClick={handlePrint}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Pop-up */}
      {printMessage ? (
        <div className="bg-[#BF9A30] z-10 absolute w-fit mx-auto text-[5em] text-white py-2 px-8 rounded-md">
          Printed!
        </div>
      ) : null}

      {/* ✅ WhatsApp popup */}
      {waMessage && (
        <div className="bg-green-600 z-10 absolute w-fit mx-auto text-[3.5em] text-white py-3 px-10 rounded-md shadow-lg">
          {waMessage}
        </div>
      )}
    </div>
  );
};

export default Result;
