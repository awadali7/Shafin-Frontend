"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";
import {
    courierBoxesApi,
    CourierBox,
    CourierBoxInput,
} from "@/lib/api/courierBoxes";
import { toast } from "sonner";

const ZONES: { field: keyof CourierBoxInput; label: string }[] = [
    { field: "charge_a", label: "A · Same City / Pincode" },
    { field: "charge_b", label: "B · Same State" },
    { field: "charge_c", label: "C · Metro ↔ Metro" },
    { field: "charge_d", label: "D · Rest of India" },
    { field: "charge_e", label: "E · Northeast" },
    { field: "charge_f", label: "F · Remote (J&K, A&N…)" },
];

const emptyForm = (): CourierBoxInput => ({
    name: "",
    weight_grams: 0,
    charge_a: 0,
    charge_b: 0,
    charge_c: 0,
    charge_d: 0,
    charge_e: 0,
    charge_f: 0,
});

export const CourierBoxesTab: React.FC = () => {
    const [boxes, setBoxes] = useState<CourierBox[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CourierBoxInput>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchBoxes = async () => {
        try {
            setLoading(true);
            const res = await courierBoxesApi.list();
            setBoxes(Array.isArray(res.data) ? res.data : []);
        } catch {
            toast.error("Failed to load courier boxes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoxes();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (box: CourierBox) => {
        setEditingId(box.id);
        setForm({
            name: box.name,
            weight_grams: Number(box.weight_grams),
            charge_a: Number(box.charge_a),
            charge_b: Number(box.charge_b),
            charge_c: Number(box.charge_c),
            charge_d: Number(box.charge_d),
            charge_e: Number(box.charge_e),
            charge_f: Number(box.charge_f),
        });
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Name is required");
            return;
        }
        try {
            setSaving(true);
            if (editingId) {
                await courierBoxesApi.update(editingId, form);
                toast.success("Courier box updated");
            } else {
                await courierBoxesApi.create(form);
                toast.success("Courier box created");
            }
            setModalOpen(false);
            fetchBoxes();
        } catch {
            toast.error("Failed to save courier box");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (
            !confirm(
                "Delete this courier box? Products using it will fall back to no shipping charge.",
            )
        )
            return;
        try {
            setDeletingId(id);
            await courierBoxesApi.delete(id);
            toast.success("Deleted");
            setBoxes((prev) => prev.filter((b) => b.id !== id));
        } catch {
            toast.error("Failed to delete");
        } finally {
            setDeletingId(null);
        }
    };

    const setCharge = (field: keyof CourierBoxInput, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value === "" ? "" : Number(value),
        }));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Courier Boxes
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Create reusable shipping rate cards. Assign one to each
                        product pricing tier.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-medium hover:bg-[#900000] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Courier Box
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading…</div>
            ) : boxes.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                    No courier boxes yet. Create one to start assigning to
                    product tiers.
                </div>
            ) : (
                <div className="space-y-3">
                    {boxes.map((box) => (
                        <div
                            key={box.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                    {box.name}
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        {Number(box.weight_grams) >= 1000
                                            ? `${Number(box.weight_grams) / 1000}kg`
                                            : `${Number(box.weight_grams)}g`} capacity
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    {ZONES.map((z) => (
                                        <span
                                            key={z.field}
                                            className="text-xs text-gray-500"
                                        >
                                            <span className="font-semibold text-gray-700">
                                                {z.field
                                                    .slice(-1)
                                                    .toUpperCase()}
                                            </span>
                                            : ₹
                                            {Number(
                                                box[
                                                    z.field as keyof CourierBox
                                                ],
                                            ).toFixed(0)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => openEdit(box)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(box.id)}
                                    disabled={deletingId === box.id}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="font-semibold text-gray-900">
                                {editingId
                                    ? "Edit Courier Box"
                                    : "New Courier Box"}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form
                            onSubmit={handleSave}
                            className="px-6 py-5 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Box Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. 1kg Box, Heavy Box"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weight Capacity (grams)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.weight_grams}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            weight_grams: e.target.value === "" ? 0 : Number(e.target.value),
                                        }))
                                    }
                                    placeholder="e.g. 1000 for 1kg box"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                />
                                <p className="text-xs text-gray-400 mt-1">Auto-selected when cart weight ≤ this value</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Zone Charges (₹)
                                </p>
                                <div className="space-y-2">
                                    {ZONES.map((z) => (
                                        <div
                                            key={z.field}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="text-xs text-gray-600 w-44 shrink-0">
                                                {z.label}
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form[z.field] as number}
                                                onChange={(e) =>
                                                    setCharge(
                                                        z.field,
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-medium hover:bg-[#900000] disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
