import React, { useState } from "react";
import { generatePdf } from "../api";
import { FaCloudUploadAlt, FaFilePdf } from "react-icons/fa";
import { saveAs } from "file-saver";

export default function AudioPdfSection() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const calculateDuration = (file) => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            }
        })
    }

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await generatePdf(file);
            // Create a blob from the response
            const pdfBlob = new Blob([response.data], { type: "application/pdf" });
            saveAs(pdfBlob, "transcript.pdf");

        } catch (err) {
            console.error("PDF generation failed:", err);
            // Try to parse error message from blob if possible, or just show generic
            setError("Failed to generate PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-backgroundLight1 dark:bg-backgroundDark3 p-4">
            <div className="bg-white dark:bg-backgroundDark2 rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center gap-6">
                <div className="text-primary text-5xl">
                    <FaFilePdf />
                </div>
                <h1 className="text-2xl font-bold dark:text-white">Audio to PDF</h1>
                <p className="text-center text-slate-500 dark:text-slate-400">
                    Upload an audio file to generate a speaker-diarized transcript PDF.
                </p>

                <div className="w-full">
                    <label
                        htmlFor="audio-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FaCloudUploadAlt className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                MP3, WAV, M4A
                            </p>
                        </div>
                        <input
                            id="audio-upload"
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                {file && (
                    <div className="w-full p-3 bg-blue-50 dark:bg-slate-800 rounded-md flex items-center justify-between">
                        <span className="text-sm truncate max-w-[200px] dark:text-white">{file.name}</span>
                        <span className="text-xs text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${loading || !file
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:bg-primary/90"
                        }`}
                >
                    {loading ? "Processing..." : "Generate PDF"}
                </button>
            </div>
        </div>
    );
}
