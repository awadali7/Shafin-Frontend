import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { settingsApi, type SiteSetting } from '@/lib/api/settings';
import { toast } from 'sonner';

export const SettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsApi.getAll();
            if (response.success && response.data) {
                setSettings(response.data);
                // Initialize edited values with current values
                const initialValues: Record<string, string> = {};
                response.data.forEach((setting) => {
                    initialValues[setting.setting_key] = setting.setting_value;
                });
                setEditedValues(initialValues);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string) => {
        try {
            setSaving(key);
            const response = await settingsApi.update(key, editedValues[key]);
            if (response.success) {
                toast.success('Setting updated successfully');
                // Update the settings list
                setSettings((prev) =>
                    prev.map((s) =>
                        s.setting_key === key
                            ? { ...s, setting_value: editedValues[key] }
                            : s
                    )
                );
            } else {
                toast.error(response.message || 'Failed to update setting');
            }
        } catch (error) {
            console.error('Error updating setting:', error);
            toast.error('Failed to update setting');
        } finally {
            setSaving(null);
        }
    };

    const handleChange = (key: string, value: string) => {
        setEditedValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const hasChanges = (key: string) => {
        const original = settings.find((s) => s.setting_key === key)?.setting_value;
        return original !== editedValues[key];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        Site Settings
                    </h3>
                    <p className="text-sm text-blue-700">
                        Configure site-wide settings. Changes will be reflected immediately on the website.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {settings.map((setting) => (
                    <div
                        key={setting.id}
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                                        {setting.setting_key
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </label>
                                    {setting.description && (
                                        <p className="text-xs text-gray-500 mb-3">
                                            {setting.description}
                                        </p>
                                    )}
                                </div>
                                {hasChanges(setting.setting_key) && (
                                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">
                                        Modified
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-3">
                                {setting.setting_type === 'textarea' ? (
                                    <textarea
                                        value={editedValues[setting.setting_key] || ''}
                                        onChange={(e) =>
                                            handleChange(setting.setting_key, e.target.value)
                                        }
                                        rows={4}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent text-sm"
                                        placeholder={`Enter ${setting.setting_key}`}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={editedValues[setting.setting_key] || ''}
                                        onChange={(e) =>
                                            handleChange(setting.setting_key, e.target.value)
                                        }
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent text-sm"
                                        placeholder={`Enter ${setting.setting_key}`}
                                    />
                                )}

                                <button
                                    onClick={() => handleSave(setting.setting_key)}
                                    disabled={
                                        saving === setting.setting_key ||
                                        !hasChanges(setting.setting_key)
                                    }
                                    className="px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                >
                                    {saving === setting.setting_key ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : hasChanges(setting.setting_key) ? (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Saved</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Preview for video URL */}
                            {setting.setting_key === 'hero_video_url' &&
                                editedValues[setting.setting_key] && (
                                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                            <p className="text-xs font-medium text-gray-700">
                                                Preview
                                            </p>
                                        </div>
                                        <div className="aspect-video bg-black">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={editedValues[setting.setting_key]}
                                                title="Video preview"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
            </div>

            {settings.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No settings available</p>
                </div>
            )}
        </div>
    );
};

export default SettingsTab;

