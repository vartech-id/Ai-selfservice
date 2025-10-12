import React, { useEffect, useState } from "react";
import { fetchPrinters, updatePrinterConfig } from "../server/api";

const Print = () => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [printSize, setPrintSize] = useState("");

  // Fetch available printers
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const data = await fetchPrinters();
        setPrinters(data.printers);
        setSelectedPrinter(data.default_printer); // Set default printer
      } catch (error) {
        console.error("Error loading printers:", error);
      }
    };

    loadPrinters();
  }, []);

  // Save settings
  const saveSettings = async () => {
    const config = {
      default_printer: selectedPrinter,
      hot_folder: {
        enabled: false, // Adjust this if needed
      },
    };

    try {
      await updatePrinterConfig(config);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving printer settings:", error);
    }
  };

  return (
    <div className="bg-black/20 text-white flex flex-col justify-center h-3/5 gap-y-10 text-[5em]">
      <h1 className="uppercase font-bold text-center">Printer Settings</h1>

      <div className="w-4/5 mx-auto">
        <label htmlFor="select-printer">Select Printer</label>
        <select
          id="select-printer"
          className="text-black w-full"
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
        >
          {printers.map((printer, index) => (
            <option key={index} value={printer} className="text-base">
              {printer}
            </option>
          ))}
        </select>
      </div>

      <div className="w-4/5 mx-auto">
        <label htmlFor="print-size">Print Size</label>
        <select
          id="print-size"
          className="text-black w-full"
          value={printSize}
          onChange={(e) => setPrintSize(e.target.value)}
        >
          <option value="4x6" className="text-base">
            4x6
          </option>
          <option value="6x4 Landscape" className="text-base">
            6x4 Landscape
          </option>
        </select>
      </div>

      <button
        className="bg-[#d2d2d2] p-2 w-3/5 mx-auto"
        onClick={saveSettings}
      >
        Save Settings
      </button>
    </div>
  );
};

export default Print;
