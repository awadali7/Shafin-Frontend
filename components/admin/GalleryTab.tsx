"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Check, X, Search, Image as ImageIcon, Trash2, CheckCircle, XCircle } from "lucide-react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { galleryApi, GalleryImage, getImageUrl } from "@/lib/api/gallery";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./utils";

export const GalleryTab: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const data = await galleryApi.getAll();
            setImages((data.data as GalleryImage[]) || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch gallery images');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [heading, setHeading] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any,
        rotation = 0,
        flip = { horizontal: false, vertical: false }
    ): Promise<File | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                if (file) {
                    resolve(new File([file], selectedFile?.name || 'cropped.jpg', { type: 'image/jpeg' }));
                } else {
                    resolve(null);
                }
            }, 'image/jpeg');
        });
    };

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            toast.error("Please select and crop an image");
            return;
        }

        try {
            setIsSubmitting(true);
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (!croppedImage) {
                toast.error("Error cropping image");
                return;
            }

            const formData = new FormData();
            formData.append('image', croppedImage);
            if (heading) formData.append('heading', heading);
            formData.append('is_active', isActive.toString());

            await galleryApi.upload(formData);
            toast.success("Gallery image uploaded successfully");
            setIsUploadModalOpen(false);
            fetchImages();
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setImageSrc(null);
        setHeading("");
        setIsActive(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleToggleStatus = async (image: GalleryImage) => {
        try {
            await galleryApi.toggleStatus(image.id, !image.is_active);
            toast.success("Image status updated");
            fetchImages();
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            await galleryApi.delete(id);
            toast.success("Image deleted successfully");
            fetchImages();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete image");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Gallery Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage public gallery images and their visibility.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Upload Image</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <span className="w-8 h-8 border-4 border-[#B00000] border-t-transparent rounded-full animate-spin inline-block"></span>
                        <p className="mt-4">Loading gallery...</p>
                    </div>
                ) : error ? (
                    <div className="col-span-full py-12 text-center text-red-500 bg-red-50 rounded-xl">
                        <p>{error}</p>
                        <button onClick={fetchImages} className="mt-2 text-sm underline hover:no-underline">Try again</button>
                    </div>
                ) : images.length > 0 ? (
                    images.map((image) => (
                        <div key={image.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                            <div className="relative aspect-square bg-gray-100">
                                <img
                                    src={getImageUrl(image.image_url)}
                                    alt={image.heading || "Gallery image"}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                                    <button
                                        onClick={() => handleToggleStatus(image)}
                                        className={`p-2 rounded-full ${image.is_active ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600'} transition-colors`}
                                        title={image.is_active ? "Deactivate" : "Activate"}
                                    >
                                        {image.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2 flex space-x-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${image.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {image.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-slate-900 truncate" title={image.heading || "No heading"}>
                                    {image.heading || "No heading"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Added {formatDate(image.created_at)}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No gallery images found.</p>
                        <p className="text-sm mt-1">Upload an image to start building your gallery.</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-slate-900">Upload Gallery Image</h2>
                            <button
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    resetForm();
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {!imageSrc ? (
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-slate-700 font-medium">Click to select an image</p>
                                    <p className="text-sm text-gray-500 mt-1">JPEG, PNG or WEBP up to 5MB</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative h-64 sm:h-80 bg-gray-900 rounded-xl overflow-hidden">
                                        <Cropper
                                            image={imageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={undefined} // Allows freeform cropping for portrait or landscape
                                            onCropChange={setCrop}
                                            onCropComplete={onCropComplete}
                                            onZoomChange={setZoom}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">Zoom</span>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setImageSrc(null)}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Choose different image
                                        </button>
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Heading (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={heading}
                                        onChange={(e) => setHeading(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        placeholder="Enter image heading..."
                                    />
                                </div>

                                <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B00000]"></div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        Publish immediately
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!imageSrc || isSubmitting}
                                className="px-4 py-2 bg-[#B00000] text-white font-medium rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <span>Upload & Save</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
