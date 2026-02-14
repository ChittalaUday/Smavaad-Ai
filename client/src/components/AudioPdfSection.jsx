import React, { useState, useRef } from "react";
import { generatePdf } from "../api";
import { CloudUpload, FileAudio, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "../context/ToastContext";
import ActionLoader from "./ActionLoader";

export default function AudioPdfSection() {
    const { showToast } = useToast();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/webm"];
        // Check if file type is somewhat valid or just accept general audio
        if (!selectedFile.type.startsWith("audio/") && !selectedFile.name.match(/\.(mp3|wav|m4a|webm|mp4)$/i)) {
            showToast("Please upload a valid audio file (MP3, WAV, M4A, WebM)", "error");
            return;
        }
        setFile(selectedFile);
        showToast("File selected successfully", "success");
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
        if (!file) {
            showToast("Please select a file first", "error");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("audio", file); // Adjust key based on your API


            const response = await generatePdf(file);
            const pdfBlob = new Blob([response.data], { type: "application/pdf" });
            saveAs(pdfBlob, `transcript_${Date.now()}.pdf`);
            showToast("PDF generated and downloaded successfully!", "success");
            handleRemoveFile();

        } catch (err) {
            console.error("PDF generation failed:", err);
            showToast("Failed to generate PDF. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

            {loading && <ActionLoader message="Transcribing audio and generating PDF..." />}

            <div className="relative glass-panel w-full max-w-lg p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col gap-6 animate-enter">

                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-2 shadow-inner">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                        Audio to PDF
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                        Upload an audio file to generate a speaker-diarized transcript PDF using AI.
                    </p>
                </div>

                {/* Upload Area */}
                <div
                    className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-300 ${dragActive
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.02]"
                        : file
                            ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-500/5"
                            : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {file ? (
                        <div className="flex flex-col items-center gap-3 animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <FileAudio size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile();
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 dark:bg-black/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                                <CloudUpload size={28} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Click to upload or drag & drop
                                </p>
                                <p className="text-xs mt-1 opacity-70">
                                    MP3, WAV, M4A, WebM (Max 50MB)
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2 ${loading || !file
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <FileText size={18} />
                            Generate PDF
                        </>
                    )}
                </button>

                {/* Info Note */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                    <AlertCircle size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                        The AI will analyze the audio to identify speakers and generate a formatted transcript in PDF format. This process may take a few minutes depending on the file duration.
                    </p>
                </div>
            </div>
        </div>
    );
}
