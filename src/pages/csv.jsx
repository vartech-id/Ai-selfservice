import React from "react";
import { exportTableToCSV } from "../server/api";

const ExportCSV = () => {
    const handleExport = async () => {
        const result = await exportTableToCSV();

        if (result.success) {
            alert("Export successful! The file has been downloaded.");
        } else {
            alert("Export failed. Please check the console for errors.");
        }
    };

    return (
        <div className="bg-black/20 text-white flex flex-col justify-center items-center h-2/5">
            <h1 className="text-[5em]">Export Database to CSV?</h1>
            <button
                className="bg-[#d2d2d2] px-10 py-2 rounded-lg text-[4em] mt-10"
                onClick={handleExport}
            >
                Export
            </button>
        </div>
    );
};

export default ExportCSV;
