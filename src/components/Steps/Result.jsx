import React, { useState } from "react";
import { printImage, sendWhatsApp } from "../../server/api";
import axios from "axios"; // masih butuh buat upload image
const API_BASE_URL = "https://5572f8bd8405.ngrok-free.app/api"; // bisa ganti ke ngrok URL

const Result = () => {
  const [qrCode, setQRCode] = useState(false);
  const [print, setPrint] = useState(false);
  const [printMessage, setPrintMessage] = useState(false);
  const [printer, setPrinter] = useState(""); // Printer selection
  const [printSize, setPrintSize] = useState("4x6"); // Default print size
  const [loading, setLoading] = useState(false);

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

  const handleSendWhatsApp = async () => {
    setLoading(true);
    try {
      const swappedPhoto = localStorage.getItem("swappedPhoto");
      if (!swappedPhoto) {
        alert("No image found!");
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
        alert("No phone number found!");
        return;
      }

      // pake sendWhatsApp dari api.jsx
      const waRes = await sendWhatsApp(phone, imageUrl);

      console.log("WA Response:", waRes);
      alert("Foto berhasil dikirim ke WhatsApp!");
      localStorage.clear();
    } catch (err) {
      console.error("Error sending WhatsApp:", err);
      alert("Gagal kirim ke WhatsApp");
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
          className="bg-green-500 text-white p-4 rounded-md text-2xl"
        >
          {loading ? "Sending..." : "Send to WhatsApp"}
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
    </div>
  );
};

export default Result;
