import React, { useEffect, useState } from "react";
import { fetchPrinters, updatePrinterConfig } from "../server/api";

const WINDOWS_DIALOG_OPTION = "WINDOWS_DEFAULT";

const Print = () => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [printSize, setPrintSize] = useState("");
  const [availableSizes, setAvailableSizes] = useState(["4x6", "6x4"]);

  // Fetch available printers
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const data = await fetchPrinters();

        const printerSet = new Set(data.printers || []);
        printerSet.add(WINDOWS_DIALOG_OPTION);
        if (data.default_printer) {
          printerSet.add(data.default_printer);
        }
        const printerOptions = Array.from(printerSet);
        setPrinters(printerOptions);
        setSelectedPrinter(data.default_printer || printerOptions[0] || "");

        const sizeSet = new Set(data.available_sizes || ["4x6", "6x4"]);
        sizeSet.add(WINDOWS_DIALOG_OPTION);
        if (data.default_print_size) {
          sizeSet.add(data.default_print_size);
        }
        const sizeOptions = Array.from(sizeSet);
        setAvailableSizes(sizeOptions);
        setPrintSize(data.default_print_size || sizeOptions[0] || "4x6");
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
      default_print_size: printSize,
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
          {printers.map((printer) => (
            <option key={printer} value={printer} className="text-base">
              {printer === WINDOWS_DIALOG_OPTION ? "Windows Print Default" : printer}
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
          {availableSizes.map((size) => (
            <option key={size} value={size} className="text-base">
              {size === WINDOWS_DIALOG_OPTION ? "Windows Print Default" : size}
            </option>
          ))}
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
