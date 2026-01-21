"use client";

import React, { useEffect, useState } from "react";
import { Copy, Trash2, FileArchive, Upload, Clock, HardDrive, Check, Download } from "lucide-react";
import { adminApi } from "@/lib/api/admin";

type DigitalFile = {
    name: string;
    size: number;
    created_at: string;
};

// api to be added to frontend/lib/api/admin.ts:
// listDigitalFiles: () => axiosInstance.get<{success:boolean, data: DigitalFile[]}>("/admin/digital-files"),
// uploadDigitalFile: (data: FormData) => axiosInstance.post("/admin/digital-files", data),
// deleteDigitalFile: (name: string) => axiosInstance.delete(`/admin/digital-files/${name}`),

const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

export const DigitalFilesTab = () => {
    const [files, setFiles] = useState<DigitalFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    
    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [customName, setCustomName] = useState("");

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const resp = await adminApi.listDigitalFiles();
            if (resp.data) {
                setFiles(resp.data);
            }
        } catch (e: any) {
            setError(e.message || "Failed to load files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        try {
            setUploading(true);
            setError(null);
            const formData = new FormData();
            formData.append("file", selectedFile);
            
            if (customName.trim()) {
                formData.append("custom_name", customName.trim());
            }
            
            await adminApi.uploadDigitalFile(formData);
            await fetchFiles(); // Refresh list
            
            // Reset and close
            setSelectedFile(null);
            setCustomName("");
            setIsUploadModalOpen(false);
        } catch (e: any) {
            setError(e.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete "${filename}"? This may break products linking to it.`)) return;
        try {
            await adminApi.deleteDigitalFile(filename);
            setFiles(prev => prev.filter(f => f.name !== filename));
        } catch (e: any) {
            alert(e.message || "Delete failed");
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback(text);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            setDownloading(filename);
            await adminApi.downloadDigitalFile(filename);
        } catch (e: any) {
            alert(e.message || "Download failed");
        } finally {
            setDownloading(null);
        }
    };

    const getFileStyle = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'zip') {
             return {
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-700',
                badgeBg: 'bg-amber-100',
                badgeColor: 'text-amber-800',
                borderColor: 'group-hover:border-amber-300',
                label: 'ZIP'
            };
        } else if (ext === 'rar') {
             return {
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-700',
                badgeBg: 'bg-purple-100',
                badgeColor: 'text-purple-800',
                borderColor: 'group-hover:border-purple-300',
                label: 'RAR'
            };
        }
        return {
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            badgeBg: 'bg-blue-50',
            badgeColor: 'text-blue-800',
            borderColor: 'group-hover:border-blue-300',
            label: ext?.toUpperCase() || 'FILE'
        };
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Upload */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Digital Files Library</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage static ZIP/RAR files for digital products</p>
                </div>
                

                
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    <span>Add file</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={() => setIsUploadModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New File</h3>
                            
                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Custom File Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="e.g. course-materials-v1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Providing a name will rename the file to <code>{`[UUID]-${customName || 'name'}.zip`}</code>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select File (ZIP/RAR) *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".zip,.rar"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        required
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading || !selectedFile}
                                        className="px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Uploading...</span>
                                            </>
                                        ) : (
                                            "Upload"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Grid View */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading library...</div>
            ) : files.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <FileArchive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No files in library</p>
                    <p className="text-sm text-gray-400 mt-1">Upload a ZIP or RAR file to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                    {files.map((file) => {
                        const style = getFileStyle(file.name);
                        return (
                            <div key={file.name} className={`group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative ${style.borderColor}`}>
                               
                               {/* File Icon & Info */}
                               <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 ${style.iconBg} ${style.iconColor} rounded-lg`}>
                                            <FileArchive className="w-6 h-6" />
                                        </div>
                                        <div className="flex items-center">
                                            <button 
                                                onClick={() => handleDelete(file.name)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete File"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${style.badgeBg} ${style.badgeColor}`}>
                                            {style.label}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-sm break-all line-clamp-2 mb-4" title={file.name}>
                                        {file.name}
                                    </h3>
                           </div>

                           {/* Metadata */}
                           <div className="space-y-3">
                                <div className="flex flex-col gap-1 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <HardDrive className="w-3.5 h-3.5" />
                                        <span>{formatBytes(file.size)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{formatDate(file.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownload(file.name)}
                                        disabled={downloading === file.name}
                                        className="flex-1 flex items-center justify-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold rounded-md bg-[#B00000] text-white hover:bg-red-800 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {downloading === file.name ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download className="w-3.5 h-3.5" />
                                        )}
                                        <span>Download</span>
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(file.name)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 border ${
                                            copyFeedback === file.name 
                                            ? "bg-green-50 border-green-200 text-green-700" 
                                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-[#B00000] hover:text-[#B00000]"
                                        }`}
                                    >
                                        {copyFeedback === file.name ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy Name</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
