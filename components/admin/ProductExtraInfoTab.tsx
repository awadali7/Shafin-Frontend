"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, X, Upload, FileText, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { productExtraInfoApi, ProductExtraInfo } from "@/lib/api/product-extra-info";
import { adminApi } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import RichTextEditor from "./RichTextEditor";

export const ProductExtraInfoTab: React.FC = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [infos, setInfos] = useState<ProductExtraInfo[]>([]);
    
    // Form state
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [pdfs, setPdfs] = useState<File[]>([]);
    const [error, setError] = useState("");

    // Grant access state
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [selectedInfo, setSelectedInfo] = useState<ProductExtraInfo | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [grantProductName, setGrantProductName] = useState("");
    const [isGranting, setIsGranting] = useState(false);

    const fetchInfos = async () => {
        setLoadingList(true);
        try {
            const res = await productExtraInfoApi.list();
            if (res.success && res.data) {
                setInfos(res.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load Product Extra Information");
        } finally {
            setLoadingList(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await adminApi.getAllUsers(1, 1000); // Fetch a nice chunk for the dropdown
            if (res.success && res.data) {
                setUsers(res.data.users);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchInfos();
        fetchUsers();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages((prev) => [...prev, ...filesArray]);
            
            const previews = filesArray.map((file) => URL.createObjectURL(file));
            setImagePreviews((prev) => [...prev, ...previews]);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setPdfs((prev) => [...prev, ...filesArray]);
        }
    };

    const removePdf = (index: number) => {
        setPdfs((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        setError("");
        setIsSaving(true);

        try {
            const response = await productExtraInfoApi.create({
                title,
                body,
                images,
                pdfs
            });

            if (response.success) {
                toast.success("Extra Information package created successfully!");
                setIsAdding(false);
                setTitle("");
                setBody("");
                setImages([]);
                setImagePreviews([]);
                setPdfs([]);
                fetchInfos(); // refresh list
            } else {
                toast.error(response.message || "Failed to save information");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGrantAccess = async () => {
        if (!selectedInfo || !selectedUserId) {
            toast.error("Please select a user");
            return;
        }
        setIsGranting(true);
        try {
            const res = await productExtraInfoApi.grantAccess({
                product_extra_info_id: selectedInfo.id,
                user_id: selectedUserId,
                product_name: grantProductName.trim() || undefined
            });
            if (res.success) {
                toast.success("Access granted and email sent!");
                setShowGrantModal(false);
                setSelectedUserId("");
                setGrantProductName("");
            } else {
                toast.error(res.message || "Failed to grant access");
            }
        } catch (e: any) {
            toast.error(e.message || "An error occurred");
        } finally {
            setIsGranting(false);
        }
    };

    if (isAdding) {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors bg-white p-2 rounded-full shadow-sm hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-bold">Add Product Extra Information</h2>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (e.target.value.trim()) setError("");
                            }}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-[#B00000] focus:border-[#B00000] ${
                                error ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Enter title"
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-500">{error}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Body Content (Rich Text)
                        </label>
                        <div>
                            <RichTextEditor
                                content={body}
                                onChange={setBody}
                                placeholder="Enter body content here..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Images
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group rounded-md overflow-hidden bg-gray-100 aspect-video">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PDF Documents
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileText className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload PDFs</span> or drag and drop
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept=".pdf,application/pdf"
                                    onChange={handlePdfUpload}
                                />
                            </label>
                        </div>

                        {pdfs.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {pdfs.map((pdf, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                                            <div className="truncate">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {pdf.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(pdf.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removePdf(index)}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
                        <button
                            onClick={() => setIsAdding(false)}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-[#B00000] text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Information"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Extra Information</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage extra details, Markdown bodies, and attached files for products.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-[#B00000] text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </button>
            </div>

            {/* List View Container */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {loadingList ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                    </div>
                ) : infos.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Extra Information</h3>
                        <p className="text-sm">Get started by clicking the "Add New" button.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {infos.map(info => (
                            <div key={info.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-red-50 rounded-lg text-[#B00000]">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{info.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(info.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => {
                                            setSelectedInfo(info);
                                            setShowGrantModal(true);
                                        }}
                                        className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                    >
                                        Grant Access
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Grant Access Modal */}
            {showGrantModal && selectedInfo && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Grant Access</h3>
                            <button onClick={() => setShowGrantModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Send the extra info package "<span className="font-semibold">{selectedInfo.title}</span>" to a user via email.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#B00000] focus:border-[#B00000]"
                                    value={selectedUserId}
                                    onChange={e => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">-- Choose User --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (Optional)</label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#B00000] focus:border-[#B00000]"
                                    placeholder="e.g. Advanced AI Course"
                                    value={grantProductName}
                                    onChange={e => setGrantProductName(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">This will be used in the email subject and body, instead of the Extra Info title.</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowGrantModal(false)}
                                disabled={isGranting}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleGrantAccess}
                                disabled={isGranting || !selectedUserId}
                                className="flex items-center gap-2 bg-[#B00000] text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isGranting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
