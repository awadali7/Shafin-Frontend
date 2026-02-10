"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// Dynamically import to avoid SSR issues
const MDEditor = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => mod.default),
    { ssr: false }
);

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Enter text here...",
    height = 200,
}) => {
    return (
        <div className="rich-text-editor" data-color-mode="light">
            <MDEditor
                value={value}
                onChange={(val) => onChange(val || '')}
                height={height}
                preview="edit"
                hideToolbar={false}
                enableScroll={true}
                visibleDragbar={false}
                placeholder={placeholder}
                autoFocus={false}
                highlightEnable={false}
                textareaProps={{
                    placeholder: placeholder,
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: false,
                }}
                commands={[
                    // Bold
                    {
                        name: 'bold',
                        keyCommand: 'bold',
                        buttonProps: { 'aria-label': 'Add bold text' },
                        icon: (
                            <svg width="12" height="12" viewBox="0 0 520 520">
                                <path fill="currentColor" d="M364,164H244V208h120a30,30,0,0,0,0-60Z" />
                                <path fill="currentColor" d="M364,280H244v80h120a40,40,0,0,0,0-80Z" />
                                <path fill="currentColor" d="M244,80H164V440H364a100,100,0,0,0,0-200,80,80,0,0,0,0-160Z" />
                            </svg>
                        ),
                    },
                    // Italic
                    {
                        name: 'italic',
                        keyCommand: 'italic',
                        buttonProps: { 'aria-label': 'Add italic text' },
                        icon: (
                            <svg width="12" height="12" viewBox="0 0 520 520">
                                <path fill="currentColor" d="M352,80h-80l-96,320h80Z" />
                            </svg>
                        ),
                    },
                    // Unordered list (bullets)
                    {
                        name: 'unorderedList',
                        keyCommand: 'unorderedList',
                        buttonProps: { 'aria-label': 'Add bullet list' },
                        icon: (
                            <svg width="12" height="12" viewBox="0 0 520 520">
                                <circle fill="currentColor" cx="100" cy="150" r="30" />
                                <circle fill="currentColor" cx="100" cy="260" r="30" />
                                <circle fill="currentColor" cx="100" cy="370" r="30" />
                                <rect fill="currentColor" x="170" y="135" width="240" height="30" />
                                <rect fill="currentColor" x="170" y="245" width="240" height="30" />
                                <rect fill="currentColor" x="170" y="355" width="240" height="30" />
                            </svg>
                        ),
                    },
                    // Ordered list (numbers)
                    {
                        name: 'orderedList',
                        keyCommand: 'orderedList',
                        buttonProps: { 'aria-label': 'Add numbered list' },
                        icon: (
                            <svg width="12" height="12" viewBox="0 0 520 520">
                                <text fill="currentColor" x="80" y="170" fontSize="80">1</text>
                                <text fill="currentColor" x="80" y="280" fontSize="80">2</text>
                                <text fill="currentColor" x="80" y="390" fontSize="80">3</text>
                                <rect fill="currentColor" x="170" y="135" width="240" height="30" />
                                <rect fill="currentColor" x="170" y="245" width="240" height="30" />
                                <rect fill="currentColor" x="170" y="355" width="240" height="30" />
                            </svg>
                        ),
                    },
                ]}
            />
            
            {/* Helper text */}
            <div className="mt-2 text-xs text-gray-500">
                <span className="font-medium">Formatting tips:</span>
                <span className="ml-2">**bold**</span>
                <span className="ml-2">*italic*</span>
                <span className="ml-2">- bullet list</span>
                <span className="ml-2">1. numbered list</span>
                <span className="ml-2"># heading</span>
            </div>
        </div>
    );
};

