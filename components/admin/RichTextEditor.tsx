"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import React, { useCallback, useEffect } from "react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link as LinkIcon,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Quote,
    Code,
} from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onImageUpload?: (file: File) => Promise<string>;
    placeholder?: string;
}

const MenuButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-md transition-colors ${isActive
            ? "bg-[#B00000] text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-[#B00000]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

const RichTextEditor = ({
    content,
    onChange,
    onImageUpload,
    placeholder = "Write something amazing...",
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-[#B00000] underline cursor-pointer",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: " max-w-full h-auto mx-auto my-4",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] max-w-none p-4",
            },
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const addImage = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && onImageUpload) {
                try {
                    const url = await onImageUpload(file);
                    if (url) {
                        editor?.chain().focus().setImage({ src: url }).run();
                    }
                } catch (error) {
                    console.error("Image upload failed:", error);
                }
            }
        };
        input.click();
    }, [editor, onImageUpload]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) {
            return;
        }

        if (url === "") {
            editor?.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#B00000] focus-within:border-transparent transition-all">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold"
                >
                    <Bold size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic"
                >
                    <Italic size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 6" />
                        <path d="M8 18C8 18 9.5 20 12 20C14.5 20 16 18 16 18" />
                    </svg>
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 size={18} />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive("codeBlock")}
                    title="Code Block"
                >
                    <Code size={18} />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <MenuButton onClick={setLink} isActive={editor.isActive("link")} title="Link">
                    <LinkIcon size={18} />
                </MenuButton>
                <MenuButton onClick={addImage} title="Insert Image">
                    <ImageIcon size={18} />
                </MenuButton>

                <div className="grow" />

                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo size={18} />
                </MenuButton>
            </div>

            {/* Editor Area */}
            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror {
                    outline: none !important;
                }
                .prose img {
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
